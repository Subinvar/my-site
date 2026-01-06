"use client";

import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type HeaderWagonProps = {
  /**
   * Когда true — показываем secondary-панель, primary уезжает вверх.
   * Когда false — показываем primary-панель.
   */
  showSecondary: boolean;

  /**
   * Нужен, чтобы:
   *  - не навешивать inert на SSR
   *  - не запускать анимацию на первом кадре после гидрации
   */
  hasHydrated: boolean;

  inertProps: (enabled: boolean) => HTMLAttributes<HTMLElement>;

  prefersReducedMotion: boolean;

  /**
   * Длительность анимации (и enter, и exit).
   * Также используется для сброса "entering/exiting".
   */
  durationMs?: number;

  /** Общие классы для обеих панелей (например: flex-верстка). */
  panelBaseClassName?: string;

  /** Доп. классы для primary/secondary панелей. */
  primaryClassName?: string;
  secondaryClassName?: string;

  /** Контент панелей. */
  primary: ReactNode;
  secondary: ReactNode;

  /**
   * Направления въезда/уезда для каждой панели.
   * По умолчанию:
   *  - enter: снизу
   *  - exit:  вверх
   */
  primaryEnterFrom?: "top" | "bottom";
  primaryExitTo?: "top" | "bottom";
  secondaryEnterFrom?: "top" | "bottom";
  secondaryExitTo?: "top" | "bottom";

  /**
   * SSR fallback (пока нет hasHydrated):
   * по умолчанию — как в исходной реализации:
   * - primary видима на lg+, скрыта на mobile
   * - secondary видима на mobile, скрыта на lg+
   *
   * Можно переопределить при необходимости.
   */
  ssrPrimaryClassName?: string;
  ssrSecondaryClassName?: string;
};

// SSR fallback (пока не известен showSecondary из JS-измерений):
// - на desktop (lg+) показываем primary
// - на mobile — secondary
const DEFAULT_SSR_PRIMARY = "hidden lg:flex";
const DEFAULT_SSR_SECONDARY = "flex lg:hidden";

/**
 * Унифицированный "вагончик" с ДВУМЯ анимациями:
 *  - enter: появление (въезд снизу)
 *  - exit:  исчезновение (уезд вверх)
 *
 * Обе панели всегда в DOM (важно для стабильности layout и для swap-анимаций),
 * но интерактивной является только активная.
 */
export const HeaderWagon = memo(function HeaderWagon({
  showSecondary,
  hasHydrated,
  inertProps,
  prefersReducedMotion,
  durationMs = 640,
  panelBaseClassName,
  primaryClassName,
  secondaryClassName,
  primary,
  secondary,
  primaryEnterFrom = "bottom",
  primaryExitTo = "top",
  secondaryEnterFrom = "bottom",
  secondaryExitTo = "top",
  ssrPrimaryClassName = DEFAULT_SSR_PRIMARY,
  ssrSecondaryClassName = DEFAULT_SSR_SECONDARY,
}: HeaderWagonProps) {
  const [motionReady, setMotionReady] = useState(false);

  const prevShowSecondaryRef = useRef(showSecondary);
  const [entering, setEntering] = useState<"primary" | "secondary" | null>(null);
  const [exiting, setExiting] = useState<"primary" | "secondary" | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    const raf = window.requestAnimationFrame(() => setMotionReady(true));
    return () => window.cancelAnimationFrame(raf);
  }, [hasHydrated]);

  // ВАЖНО: layout-effect, чтобы при переключении showSecondary
  // не было «промежуточного кадра» (мгновенная подмена без анимации).
  useLayoutEffect(() => {
    if (!hasHydrated) return;

    // На первом кадре после гидрации (и при reduced-motion) не запускаем анимации.
    if (!motionReady || prefersReducedMotion) {
      prevShowSecondaryRef.current = showSecondary;
      return;
    }

    const prev = prevShowSecondaryRef.current;
    if (prev === showSecondary) return;

    const outgoing: "primary" | "secondary" = prev ? "secondary" : "primary";
    const incoming: "primary" | "secondary" = showSecondary ? "secondary" : "primary";

    prevShowSecondaryRef.current = showSecondary;
    // Синхронно выставляем entering/exiting в layout-effect:
    // так браузер не успевает нарисовать кадр без анимации.
    setExiting(outgoing);
    setEntering(incoming);

    const t = window.setTimeout(() => {
      setExiting(null);
      setEntering(null);
    }, durationMs);

    return () => window.clearTimeout(t);
  }, [showSecondary, hasHydrated, motionReady, prefersReducedMotion, durationMs]);

  const activePanel: "primary" | "secondary" = showSecondary ? "secondary" : "primary";
  const shouldAnimate = hasHydrated && motionReady && !prefersReducedMotion;
  const enteringPanel = shouldAnimate ? entering : null;
  const exitingPanel = shouldAnimate ? exiting : null;

  const base = cn(
    "absolute inset-0 h-full w-full",
    "will-change-[transform,opacity]",
    panelBaseClassName,
  );

  const visible = "opacity-100";
  // Неактивную панель держим вне экрана (по умолчанию снизу).
  const hidden = "opacity-0 translate-y-full";

  const toTranslate = (dir: "top" | "bottom") => (dir === "top" ? "-100%" : "100%");

  const primaryVars =
    {
      "--wagon-ms": `${durationMs}ms`,
      "--wagon-in-from": toTranslate(primaryEnterFrom),
      "--wagon-out-to": toTranslate(primaryExitTo),
    } as CSSProperties;

  const secondaryVars =
    {
      "--wagon-ms": `${durationMs}ms`,
      "--wagon-in-from": toTranslate(secondaryEnterFrom),
      "--wagon-out-to": toTranslate(secondaryExitTo),
    } as CSSProperties;

  const primaryState = (() => {
    if (!hasHydrated) return ssrPrimaryClassName;

    const isActive = activePanel === "primary";
    const isEntering = enteringPanel === "primary";
    const isExiting = exitingPanel === "primary";

    if (isExiting) {
      return cn("z-10 pointer-events-none", visible, "animate-wagon-out motion-reduce:animate-none");
    }

    if (isEntering) {
      return cn("z-20 pointer-events-auto", visible, "animate-wagon-in motion-reduce:animate-none");
    }

    return isActive
      ? cn("z-20 pointer-events-auto", visible)
      : cn("z-0 pointer-events-none", hidden);
  })();

  const secondaryState = (() => {
    if (!hasHydrated) return ssrSecondaryClassName;

    const isActive = activePanel === "secondary";
    const isEntering = enteringPanel === "secondary";
    const isExiting = exitingPanel === "secondary";

    if (isExiting) {
      return cn("z-10 pointer-events-none", visible, "animate-wagon-out motion-reduce:animate-none");
    }

    if (isEntering) {
      return cn("z-20 pointer-events-auto", visible, "animate-wagon-in motion-reduce:animate-none");
    }

    return isActive
      ? cn("z-20 pointer-events-auto", visible)
      : cn("z-0 pointer-events-none", hidden);
  })();

  return (
    <>
      <div
        aria-hidden={hasHydrated ? (activePanel === "primary" ? undefined : true) : undefined}
        {...inertProps(hasHydrated ? activePanel !== "primary" : false)}
        className={cn(base, primaryClassName, primaryState)}
        style={primaryVars}
      >
        {primary}
      </div>

      <div
        aria-hidden={hasHydrated ? (activePanel === "secondary" ? undefined : true) : undefined}
        {...inertProps(hasHydrated ? activePanel !== "secondary" : false)}
        className={cn(base, secondaryClassName, secondaryState)}
        style={secondaryVars}
      >
        {secondary}
      </div>
    </>
  );
});

type UseDelayedCollapseOptions = {
  delayMs?: number;
  hasHydrated: boolean;
  prefersReducedMotion: boolean;
};

/**
 * Утилита: когда shouldCollapse=true — ждём delayMs и только потом «схлопываем».
 * Нужна для top-wagons, чтобы сначала отъехали вверх, а уже потом ушла ширина в 0.
 */
export function useDelayedCollapse(
  shouldCollapse: boolean,
  { delayMs = 640, hasHydrated, prefersReducedMotion }: UseDelayedCollapseOptions,
) {
  const [collapsed, setCollapsed] = useState(false);

  // Нужен для «первичной синхронизации» после гидрации:
  // если уже на старте мы в shouldCollapse=true (например, мобильный экран),
  // схлопываем сразу, без задержки, чтобы не было вспышки ширины.
  const didInitRef = useRef(false);

  useLayoutEffect(() => {
    if (!hasHydrated) {
      didInitRef.current = false;
      return;
    }

    if (!didInitRef.current) {
      didInitRef.current = true;
      setCollapsed(shouldCollapse);
      return;
    }

    if (!shouldCollapse) {
      setCollapsed(shouldCollapse);
      return;
    }

    if (prefersReducedMotion) {
      setCollapsed(shouldCollapse);
      return;
    }

    const t = window.setTimeout(() => setCollapsed(true), delayMs);
    return () => window.clearTimeout(t);
  }, [shouldCollapse, delayMs, hasHydrated, prefersReducedMotion]);

  return collapsed;
}
