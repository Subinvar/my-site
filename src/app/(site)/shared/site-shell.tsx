"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import Image from "next/image";

import { getInterfaceDictionary } from "@/content/dictionary";
import { NavigationList } from "@/app/[locale]/navigation-list";
import type { Navigation, SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";
import { buildPath } from "@/lib/paths";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./language-switcher";
import { HtmlLangSync } from "./html-lang-sync";
import { ThemeToggle } from "./theme-toggle";

const HEADER_NAV_STABLE_SLOTS: Record<string, number> = {
  products: 116,
  news: 96,
  about: 124,
  partners: 120,
  contacts: 120,
};

const HEADER_TOP_STABLE_SLOTS: Record<string, number> = {
  phone: 156,
  email: 140,
  theme: 40,
  lang: 40,
  cta: 200,
};

const brandFont = { variable: "font-brand-var" };

type SiteShellProps = {
  locale: Locale;
  targetLocale: Locale;
  site: SiteContent;
  navigation: Navigation;
  switcherHref: string | null;
  currentPath: string;
  currentYear: number;
  children: ReactNode;
};

function SkipToContentLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:not-sr-only focus-visible:rounded focus-visible:bg-brand-600 focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      {label}
    </a>
  );
}

function HeaderTopSlot({
  id,
  className,
  children,
  stableSlots = HEADER_TOP_STABLE_SLOTS,
}: {
  id: string;
  className?: string;
  children: ReactNode;
  stableSlots?: Record<string, number>;
}) {
  const slotWidth = stableSlots[id];

  return (
    <div
      data-header-top-slot={id}
      className={cn(
        slotWidth ? "flex flex-none justify-end" : "inline-flex",
        // важно: min-w-0 + overflow-hidden позволяют truncate реально работать
        "h-10 min-w-0 items-center overflow-hidden",
        className,
      )}
      style={
        slotWidth ? ({ width: `${slotWidth}px` } as CSSProperties) : undefined
      }
    >
      {children}
    </div>
  );
}

function HeaderTopPillLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center rounded-xl px-3",
        // рамка появляется только на hover/focus (как у остальных контролов шапки)
        "border border-transparent bg-background/70",
        "hover:border-[var(--header-border)] focus-visible:border-[var(--header-border)]",
        "text-muted-foreground no-underline",
        "transition-colors duration-200 ease-out motion-reduce:transition-none motion-reduce:duration-0",
        "hover:bg-background/80 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        "truncate",
      )}
    >
      {label}
    </a>
  );
}

function HeaderCta({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "group inline-flex h-10 items-center justify-center rounded-xl px-4",
        "border border-[var(--header-border)] bg-background/70",
        "focus-visible:border-[var(--header-border)]",
        "text-muted-foreground hover:text-foreground",
        "no-underline hover:no-underline",
        "transition-colors duration-200 ease-out motion-reduce:transition-none motion-reduce:duration-0",
        "hover:bg-background/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "focus-visible:ring-brand-600 focus-visible:ring-offset-[var(--background)]",
        "text-[clamp(0.935rem,0.858rem+0.275vw,1.078rem)] font-medium leading-tight",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="relative mr-2.5 inline-flex h-3.5 w-3.5 items-center justify-center"
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-[radial-gradient(circle,transparent_0%,transparent_52%,rgba(148,27,32,0.24)_60%,rgba(148,27,32,0)_86%)]",
          )}
        />
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            "will-change-transform",
            "bg-[radial-gradient(circle,transparent_0%,transparent_52%,rgba(148,27,32,0.68)_60%,rgba(148,27,32,0)_86%)]",
            "animate-cta-ripple motion-reduce:animate-none",
            "group-hover:bg-[radial-gradient(circle,transparent_0%,transparent_52%,rgba(148,27,32,0.78)_60%,rgba(148,27,32,0)_86%)]",
          )}
        />
        <span
          className={cn(
            "relative h-2.5 w-2.5 overflow-hidden rounded-full",
            "bg-[radial-gradient(circle_at_center,var(--color-brand-600)_0%,var(--color-brand-600)_56%,#a8242c_72%,#f7d5dc_100%)]",
            'after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.08)_70%,transparent_100%)] after:content-[""]',
            "shadow-[0_0_0_1.5px_rgba(148,27,32,0.18)]",
          )}
        />
      </span>
      {children ?? label}
    </Link>
  );
}

export function SiteShell({
  locale,
  targetLocale,
  site,
  navigation,
  switcherHref,
  currentPath,
  currentYear,
  children,
}: SiteShellProps) {
  const brandName = site.name?.trim() ?? "";
  const dictionary = getInterfaceDictionary(locale);
  const skipLinkLabel = dictionary.common.skipToContent;
  const navigationLabels = dictionary.navigation;
  const switchToLabels = dictionary.languageSwitcher.switchTo;

  const brandLabel = brandName || "Интема Групп";

  const copyrightTemplate = site.footer?.copyright?.trim() ?? "";
  const copyrightText = copyrightTemplate.length
    ? copyrightTemplate
        .replaceAll("{year}", String(currentYear))
        .replaceAll("{siteName}", brandName)
    : "";
  const hasCopyright = copyrightText.length > 0;

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ====== Шаг 3: “меню уезжает вверх → снизу приезжает бургер” ======
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isCompactNav, setIsCompactNav] = useState(false);
  const [isLgUp, setIsLgUp] = useState(false);

  const [hasHydrated, setHasHydrated] = useState(false);
  const [transitionsOn, setTransitionsOn] = useState(false);

  const navHostRef = useRef<HTMLDivElement | null>(null);
  const navMeasureRef = useRef<HTMLDivElement | null>(null);

  const isBurgerMode = !isLgUp || isCompactNav;

  // Top row wagons: keep width during fly-up, collapse after animation (prevents diagonal “flight”)
  const [topWagonIsBurger, setTopWagonIsBurger] = useState(false);
  const [topWagonsCollapsed, setTopWagonsCollapsed] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    // В burger-mode: сначала «улетаем вверх», и только потом схлопываем ширину
    if (isBurgerMode) {
      setTopWagonsCollapsed(false);
      setTopWagonIsBurger(true);

      if (prefersReducedMotion) {
        setTopWagonsCollapsed(true);
        return;
      }

      const t = window.setTimeout(() => setTopWagonsCollapsed(true), 320);
      return () => window.clearTimeout(t);
    }

    // Выходим из burger-mode: сначала раскрываем ширину, потом «приезжаем вниз» (следующим кадром)
    setTopWagonsCollapsed(false);
    if (prefersReducedMotion) {
      setTopWagonIsBurger(false);
      return;
    }

    const frame = window.requestAnimationFrame(() =>
      setTopWagonIsBurger(false),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [isBurgerMode, prefersReducedMotion, hasHydrated]);

  const inertProps = (enabled: boolean): HTMLAttributes<HTMLElement> =>
    enabled ? { inert: true } : {};

  const [isHeaderElevated, setIsHeaderElevated] = useState(false);
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

  const [areLinesConverged, setAreLinesConverged] = useState(false);
  const [isBurgerRotated, setIsBurgerRotated] = useState(false);
  const prevIsMenuOpenRef = useRef(isMenuOpen);

  // CTA
  const basePathRaw = buildPath(locale);
  const basePath =
    basePathRaw !== "/" && basePathRaw.endsWith("/")
      ? basePathRaw.slice(0, -1)
      : basePathRaw;
  const contactsHref = basePath === "/" ? "/contacts" : `${basePath}/contacts`;
  const ctaLabel = locale === "ru" ? "Оставить заявку" : "Send inquiry";
  const ctaCompactLabel = locale === "ru" ? "Заявка" : "Inquiry";

  const topContactsIds = [
    site.contacts.phone ? ("phone" as const) : null,
    site.contacts.email ? ("email" as const) : null,
  ].filter(Boolean) as Array<"phone" | "email">;

  const topContactsWidth =
    topContactsIds.reduce(
      (acc, id) => acc + (HEADER_TOP_STABLE_SLOTS[id] ?? 0),
      0,
    ) + (topContactsIds.length > 1 ? 24 : 0);

  const hasTopContacts = topContactsIds.length > 0;

  useLayoutEffect(() => {
    setHasHydrated(true);
  }, []);

  // Включаем анимации «вагончиков» только во время реального ресайза окна
  useEffect(() => {
    let timer: number | undefined;

    const onResize = () => {
      setTransitionsOn(true);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setTransitionsOn(false), 350);
    };

    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useLayoutEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lg = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      setPrefersReducedMotion(rm.matches);
      setIsLgUp(lg.matches);
    };

    update();

    rm.addEventListener("change", update);
    lg.addEventListener("change", update);

    return () => {
      rm.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- координаты для пошаговой анимации бургера */
  useEffect(() => {
    const prevIsMenuOpen = prevIsMenuOpenRef.current;
    prevIsMenuOpenRef.current = isMenuOpen;

    if (prevIsMenuOpen === isMenuOpen) return;

    if (prefersReducedMotion) {
      setAreLinesConverged(isMenuOpen);
      setIsBurgerRotated(isMenuOpen);
      return;
    }

    let timer: number | undefined;
    const frameId = window.requestAnimationFrame(() => {
      if (isMenuOpen) {
        setAreLinesConverged(true);
        setIsBurgerRotated(false);
        timer = window.setTimeout(() => setIsBurgerRotated(true), 120);
      } else {
        setIsBurgerRotated(false);
        setAreLinesConverged(true);
        timer = window.setTimeout(() => setAreLinesConverged(false), 120);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timer) window.clearTimeout(timer);
    };
  }, [isMenuOpen, prefersReducedMotion]);
  /* eslint-enable react-hooks/set-state-in-effect -- возвращаем правило после анимации */

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const headerEl = headerRef.current;
    const shellEl = shellRef.current;
    if (!headerEl || !shellEl || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const h = Math.round(headerEl.getBoundingClientRect().height);
      shellEl.style.setProperty("--header-height", `${h}px`);
    };

    const observer = new ResizeObserver(update);
    observer.observe(headerEl);
    update();

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!isLgUp) {
      const frame = window.requestAnimationFrame(() => setIsCompactNav(false));
      return () => window.cancelAnimationFrame(frame);
    }

    const host = navHostRef.current;
    const measure = navMeasureRef.current;
    if (!host || !measure || typeof ResizeObserver === "undefined") return;

    const HYST = 32;
    const PAD = 16;
    let raf = 0;

    const recalc = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const hostW = Math.round(host.getBoundingClientRect().width);
        const navW = Math.round(measure.getBoundingClientRect().width);
        if (!hostW || !navW) return;

        setIsCompactNav((prev) => {
          if (!prev) return navW > hostW - PAD;
          return navW > hostW - (HYST + PAD);
        });
      });
    };

    const ro = new ResizeObserver(recalc);
    ro.observe(host);
    ro.observe(measure);
    recalc();

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [isLgUp]);

  useEffect(() => {
    if (!isBurgerMode && isMenuOpen) {
      const frame = window.requestAnimationFrame(() => setIsMenuOpen(false));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [isBurgerMode, isMenuOpen]);

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = !entry.isIntersecting;
        setIsHeaderElevated((prev) => (prev === next ? prev : next));
      },
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateElevation = () => {
      const next = window.scrollY > 1;
      setIsHeaderElevated((prev) => (prev === next ? prev : next));
    };

    updateElevation();
    window.addEventListener("scroll", updateElevation, { passive: true });

    return () => window.removeEventListener("scroll", updateElevation);
  }, []);

  const topLineTransform = `translate(-50%, -50%) translateY(${areLinesConverged ? 0 : -4}px) rotate(${isBurgerRotated ? 45 : 0}deg)`;
  const bottomLineTransform = `translate(-50%, -50%) translateY(${areLinesConverged ? 0 : 4}px) rotate(${isBurgerRotated ? -45 : 0}deg)`;

  const openMenuLabel = locale === "ru" ? "Открыть меню" : "Open menu";
  const closeMenuLabel = locale === "ru" ? "Закрыть меню" : "Close menu";

  const shellTransitionClass = transitionsOn
    ? "transition-[padding-top] duration-200 ease-out"
    : "transition-none";
  const wagonTransitionClass = transitionsOn
    ? "transition-transform duration-300 ease-out"
    : "transition-none";
  const slideTransitionClass = transitionsOn
    ? "transition-[opacity,transform] duration-200 ease-out"
    : "transition-none";
  const burgerDelayClass = transitionsOn ? "delay-75" : "delay-0";

  // Чтобы верхняя линия «приезжала» строго сверху, а не по диагонали, выключаем
  // анимацию ширины во время раскрытия (в этот момент topWagonIsBurger уже false)
  const topWagonWidthTransitionClass =
    transitionsOn && topWagonIsBurger
      ? "transition-[width] duration-200 ease-out"
      : "transition-none";

  const wagonTransformClass = hasHydrated
    ? isBurgerMode
      ? "-translate-y-1/2"
      : "translate-y-0"
    : "-translate-y-1/2 lg:translate-y-0";

  const topWagonTransformClass = hasHydrated
    ? topWagonIsBurger
      ? "-translate-y-1/2"
      : "translate-y-0"
    : "-translate-y-1/2 lg:translate-y-0";

  const menuSlideClass = hasHydrated
    ? isBurgerMode
      ? "opacity-0 pointer-events-none -translate-y-1"
      : "opacity-100 pointer-events-auto translate-y-0"
    : "opacity-0 pointer-events-none -translate-y-1 lg:opacity-100 lg:pointer-events-auto lg:translate-y-0";

  const burgerSlideClass = hasHydrated
    ? isBurgerMode
      ? "opacity-100 pointer-events-auto translate-y-0"
      : "opacity-0 pointer-events-none translate-y-1"
    : "opacity-100 pointer-events-auto translate-y-0 lg:opacity-0 lg:pointer-events-none lg:translate-y-1";

  return (
    <div
      ref={shellRef}
      className={cn(
        brandFont.variable,
        "theme-transition relative flex min-h-screen flex-col bg-background text-foreground",
        shellTransitionClass,
        "motion-reduce:transition-none motion-reduce:duration-0",
      )}
      style={
        {
          "--header-height": "var(--header-height-initial)",
          paddingTop: "var(--header-height)",
        } as CSSProperties
      }
    >
      <HtmlLangSync initialLocale={locale} />
      <SkipToContentLink label={skipLinkLabel} />

      <div
        ref={scrollSentinelRef}
        className="absolute inset-x-0 top-0 h-1 w-px"
        aria-hidden
      />

      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 overflow-hidden backdrop-blur before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:block before:h-px before:translate-y-[1px] before:bg-[var(--color-brand-600)] before:opacity-0 before:transition-opacity before:duration-200 before:ease-out before:content-['']",
          "transition-[box-shadow,background-color,backdrop-filter] duration-200 ease-out",
          "motion-reduce:transition-none motion-reduce:duration-0",
          isHeaderElevated
            ? "bg-background/95 shadow-[0_14px_38px_rgba(0,0,0,0.12)] backdrop-blur-md before:opacity-100"
            : "bg-background/90 backdrop-blur",
        )}
      >
        <div className="relative">
          <div className="mx-auto w-full max-w-full">
            <div
              className={cn(
                "flex w-full items-center justify-between",
                "gap-[var(--header-gap-x)] px-[var(--header-pad-x)] py-[var(--header-pad-y)]",
                "lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-stretch lg:gap-x-6",
              )}
            >
              {/* Левый край: логотип */}
              <div className="flex items-center lg:h-full lg:w-full lg:items-center lg:justify-start lg:rounded-lg">
                <a
                  href={buildPath(locale)}
                  className="flex items-center gap-2 text-left no-underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Image
                    src="/uploads/logo.svg"
                    alt={brandLabel}
                    width={116}
                    height={116}
                    priority
                    sizes="(min-width: 1024px) 116px, (min-width: 640px) 96px, 78px"
                    className="h-[var(--header-logo-h)] w-auto object-contain"
                  />
                  <span
                    className={cn(
                      "font-[var(--font-heading)]",
                      "text-[length:var(--header-brand-fs)] font-bold leading-[1.05]",
                      "tracking-[-0.02em] text-brand-600 dark:text-brand-600",
                    )}
                  >
                    {brandLabel}
                  </span>
                </a>
              </div>

              {/* RIGHT */}
              <div
                className={cn(
                  "w-full min-w-0",
                  "grid grid-rows-[auto_auto] gap-y-2",
                  "lg:grid-rows-[minmax(40px,auto)_minmax(40px,auto)] lg:gap-y-2",
                )}
              >
                {/* Верхняя строка */}
                <div className="flex h-full w-full min-w-0 max-w-full items-center justify-end gap-6 rounded-lg text-[clamp(0.935rem,0.858rem+0.275vw,1.078rem)] font-medium leading-tight">
                  {/* Контакты: «вагончик» (улетают вверх при появлении бургера) */}
                  {hasTopContacts ? (
                    <div
                      className={cn(
                        "relative hidden h-10 overflow-hidden md:block",
                        topWagonWidthTransitionClass,
                        "motion-reduce:transition-none motion-reduce:duration-0",
                      )}
                      style={
                        {
                          width: topWagonsCollapsed
                            ? 0
                            : `${topContactsWidth}px`,
                        } as CSSProperties
                      }
                    >
                      <div
                        className={cn(
                          "absolute inset-0 h-[200%] w-full will-change-transform transform-gpu",
                          wagonTransitionClass,
                          "motion-reduce:transition-none motion-reduce:duration-0",
                          topWagonTransformClass,
                        )}
                      >
                        {/* SLIDE 1: контакты видны */}
                        <div
                          aria-hidden={
                            hasHydrated ? topWagonIsBurger : undefined
                          }
                          {...inertProps(
                            hasHydrated ? topWagonIsBurger : false,
                          )}
                          className={cn(
                            "flex h-1/2 w-full items-center justify-end gap-6",
                            slideTransitionClass,
                            "motion-reduce:transition-none motion-reduce:duration-0",
                            menuSlideClass,
                          )}
                        >
                          {site.contacts.phone ? (
                            <HeaderTopSlot
                              id="phone"
                              className="hidden md:inline-flex"
                            >
                              <HeaderTopPillLink
                                href={`tel:${site.contacts.phone.replace(/[^+\d]/g, "")}`}
                                label={site.contacts.phone}
                              />
                            </HeaderTopSlot>
                          ) : null}

                          {site.contacts.email ? (
                            <HeaderTopSlot
                              id="email"
                              className="hidden md:inline-flex"
                            >
                              <HeaderTopPillLink
                                href={`mailto:${site.contacts.email}`}
                                label={site.contacts.email}
                              />
                            </HeaderTopSlot>
                          ) : null}
                        </div>

                        {/* SLIDE 2: контакты скрыты */}
                        <div
                          aria-hidden={
                            hasHydrated ? !topWagonIsBurger : undefined
                          }
                          {...inertProps(
                            hasHydrated ? !topWagonIsBurger : false,
                          )}
                          className={cn(
                            "flex h-1/2 w-full items-center justify-end gap-6",
                            slideTransitionClass,
                            burgerDelayClass,
                            "motion-reduce:transition-none motion-reduce:duration-0 motion-reduce:delay-0",
                            burgerSlideClass,
                          )}
                        >
                          {/* пусто намеренно */}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* CTA: живёт до burger-mode, потом «улетает вверх» (и переезжает вниз к бургеру) */}
                  <div
                    className={cn(
                      "relative hidden h-10 overflow-hidden md:block",
                      topWagonWidthTransitionClass,
                      "motion-reduce:transition-none motion-reduce:duration-0",
                    )}
                    style={
                      {
                        width: topWagonsCollapsed
                          ? 0
                          : HEADER_TOP_STABLE_SLOTS.cta,
                      } as CSSProperties
                    }
                  >
                    <div
                      className={cn(
                        "absolute inset-0 h-[200%] w-full will-change-transform transform-gpu",
                        wagonTransitionClass,
                        "motion-reduce:transition-none motion-reduce:duration-0",
                        topWagonTransformClass,
                      )}
                    >
                      {/* SLIDE 1: CTA видна */}
                      <div
                        aria-hidden={hasHydrated ? topWagonIsBurger : undefined}
                        {...inertProps(hasHydrated ? topWagonIsBurger : false)}
                        className={cn(
                          "flex h-1/2 w-full items-center justify-end",
                          slideTransitionClass,
                          "motion-reduce:transition-none motion-reduce:duration-0",
                          menuSlideClass,
                        )}
                      >
                        <HeaderCta
                          href={contactsHref}
                          label={ctaLabel}
                          className="w-full"
                        />
                      </div>

                      {/* SLIDE 2: CTA скрыта */}
                      <div
                        aria-hidden={
                          hasHydrated ? !topWagonIsBurger : undefined
                        }
                        {...inertProps(hasHydrated ? !topWagonIsBurger : false)}
                        className={cn(
                          "flex h-1/2 w-full items-center justify-end",
                          slideTransitionClass,
                          burgerDelayClass,
                          "motion-reduce:transition-none motion-reduce:duration-0 motion-reduce:delay-0",
                          burgerSlideClass,
                        )}
                      >
                        {/* пусто намеренно */}
                      </div>
                    </div>
                  </div>

                  <HeaderTopSlot id="theme">
                    <ThemeToggle />
                  </HeaderTopSlot>

                  <HeaderTopSlot id="lang">
                    <LanguageSwitcher
                      currentLocale={locale}
                      targetLocale={targetLocale}
                      href={switcherHref}
                      switchToLabels={switchToLabels}
                    />
                  </HeaderTopSlot>
                </div>

                {/* Нижняя строка: “вагончик” меню↔бургер */}
                <div
                  ref={navHostRef}
                  className={cn(
                    "relative w-full overflow-hidden rounded-lg",
                    "h-11",
                    "lg:h-full lg:min-h-[44px]",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 h-[200%] w-full will-change-transform transform-gpu",
                      wagonTransitionClass,
                      "motion-reduce:transition-none motion-reduce:duration-0",
                      wagonTransformClass,
                    )}
                  >
                    {/* SLIDE 1: Меню */}
                    <div
                      aria-hidden={hasHydrated ? isBurgerMode : undefined}
                      {...inertProps(hasHydrated ? isBurgerMode : false)}
                      className={cn(
                        "flex h-1/2 w-full items-center justify-end",
                        slideTransitionClass,
                        "motion-reduce:transition-none motion-reduce:duration-0",
                        menuSlideClass,
                      )}
                    >
                      <NavigationList
                        links={navigation.header}
                        ariaLabel={navigationLabels.headerLabel}
                        currentPath={currentPath}
                        className="flex h-full items-center"
                        density="compact"
                        stableSlots={HEADER_NAV_STABLE_SLOTS}
                      />
                    </div>

                    {/* SLIDE 2: Бургер */}
                    <div
                      aria-hidden={hasHydrated ? !isBurgerMode : undefined}
                      {...inertProps(hasHydrated ? !isBurgerMode : false)}
                      className={cn(
                        "flex h-1/2 w-full items-center justify-end",
                        slideTransitionClass,
                        burgerDelayClass,
                        "motion-reduce:transition-none motion-reduce:duration-0 motion-reduce:delay-0",
                        burgerSlideClass,
                      )}
                    >
                      <div className="flex items-center justify-end gap-3">
                        <HeaderCta
                          href={contactsHref}
                          label={ctaLabel}
                          className="px-3 whitespace-nowrap"
                        >
                          <span className="hidden min-[420px]:inline">
                            {ctaLabel}
                          </span>
                          <span className="min-[420px]:hidden">
                            {ctaCompactLabel}
                          </span>
                        </HeaderCta>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                            "border border-transparent bg-background/70 text-foreground",
                            "transition-colors duration-200 ease-out motion-reduce:transition-none motion-reduce:duration-0",
                            "hover:border-[var(--border)] hover:bg-background/80 hover:text-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                            "focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-[var(--background)]",
                          )}
                          onClick={() => setIsMenuOpen((prev) => !prev)}
                          aria-label={
                            isMenuOpen ? closeMenuLabel : openMenuLabel
                          }
                          aria-expanded={isMenuOpen}
                        >
                          <span className="relative block h-4 w-5">
                            <span
                              className="absolute left-1/2 top-1/2 h-[2px] w-full rounded-full bg-current transition-transform duration-200 motion-reduce:transition-none motion-reduce:duration-0"
                              style={{ transform: topLineTransform }}
                            />
                            <span
                              className="absolute left-1/2 top-1/2 h-[2px] w-full rounded-full bg-current transition-transform duration-200 motion-reduce:transition-none motion-reduce:duration-0"
                              style={{ transform: bottomLineTransform }}
                            />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Линейка для измерения ширины меню */}
                  <div
                    ref={navMeasureRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 invisible inline-block w-max"
                  >
                    <NavigationList
                      links={navigation.header}
                      ariaLabel={navigationLabels.headerLabel}
                      currentPath={currentPath}
                      className="inline-block w-max"
                      density="compact"
                      stableSlots={HEADER_NAV_STABLE_SLOTS}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Боковая панель меню — только когда реально в burger-mode */}
        {isBurgerMode ? (
          <nav
            className={cn(
              "fixed inset-y-0 right-0 z-40 w-full max-w-xs border-l border-border bg-background/95 shadow-lg",
              "backdrop-blur-sm",
              "transform-gpu transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0",
              isMenuOpen ? "translate-x-0" : "translate-x-full",
            )}
            style={{ top: "var(--header-height)", bottom: 0 } as CSSProperties}
          >
            <div className="flex h-full flex-col gap-4 p-6">
              <HeaderCta
                href={contactsHref}
                label={ctaLabel}
                className="w-full justify-center"
              />
              <div className="flex flex-col gap-2 text-sm">
                {site.contacts.phone ? (
                  <a
                    href={`tel:${site.contacts.phone.replace(/[^+\d]/g, "")}`}
                    className="text-foreground no-underline hover:underline underline-offset-4"
                  >
                    {site.contacts.phone}
                  </a>
                ) : null}

                {site.contacts.email ? (
                  <a
                    href={`mailto:${site.contacts.email}`}
                    className="text-foreground no-underline hover:underline underline-offset-4"
                  >
                    {site.contacts.email}
                  </a>
                ) : null}
              </div>

              <NavigationList
                links={navigation.header}
                ariaLabel={navigationLabels.headerLabel}
                currentPath={currentPath}
                density="compact"
              />
            </div>
          </nav>
        ) : null}
      </header>

      {/* Overlay — только в burger-mode */}
      {isBurgerMode && isMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label={closeMenuLabel}
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <main
        id="main"
        role="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      >
        {children}
      </main>

      <footer className="border-t border-border bg-muted/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <NavigationList
              links={navigation.footer}
              ariaLabel={navigationLabels.footerLabel}
              currentPath={currentPath}
            />
          </div>

          {hasCopyright ? (
            <p className="text-[11px] sm:text-xs">{copyrightText}</p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
