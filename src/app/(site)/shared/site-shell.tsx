"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { getInterfaceDictionary } from "@/content/dictionary";
import type { Navigation, NavigationLink, SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";
import { buildPath } from "@/lib/paths";
import { cn } from "@/lib/cn";
import { focusRingBase } from "@/lib/focus-ring";
import { navUnderlineSpanClass } from "@/lib/nav-underline";
import { formatTelegramHandle } from "@/lib/contacts";
import {
  BURGER_MENU_CLOSE_MS,
  BURGER_MENU_OPEN_MS,
  BURGER_MENU_TEXT_ENTER_DELAY_MS,
  BURGER_MENU_TEXT_ENTER_MS,
  BURGER_MENU_TEXT_EXIT_MS,
  BURGER_MENU_TEXT_STAGGER_MS,
  DESKTOP_DROPDOWN_CLOSE_MS,
  DESKTOP_DROPDOWN_HOVER_OPEN_DELAY_MS,
} from "@/lib/nav-motion";
import { HtmlLangSync } from "./html-lang-sync";
import { useMediaBreakpoints } from "./hooks/use-media-breakpoints";
import { useResizeTransitions } from "./hooks/use-resize-transitions";
import { useBurgerAnimation } from "./hooks/use-burger-animation";
import { useScrollElevation } from "./hooks/use-scroll-elevation";
import { useWindowResize } from "./hooks/use-window-resize";
import { HeaderBrand } from "./header-brand";
import { HeaderDesktopDropdown } from "./header-desktop-dropdown";
import { HeaderNav } from "./header-nav";
import { HeaderTopBar, HEADER_TOP_STABLE_SLOTS } from "./header-top-bar";

const normalizePathname = (value: string): string => {
  const [pathWithoutQuery] = value.split("?");
  const [path] = (pathWithoutQuery ?? "").split("#");
  const trimmed = (path ?? "/").replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
};

const isExternalHref = (href: string): boolean => {
  const normalized = resolveHref(href);
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("//") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:")
  );
};

const resolveHref = (href: string): string => {
  const normalized = (href ?? "").trim();
  return normalized.length ? normalized : "/";
};

type SiteShellProps = {
  locale: Locale;
  targetLocale: Locale;
  site: SiteContent;
  navigation: Navigation;
  switcherHref: string | null;
  currentPath: string;
  children: ReactNode;
  footer?: ReactNode;
};

// ✅ Фикс "съеденных 1px": оставляем border прозрачным (чтобы НЕ менять геометрию),
// а видимую обводку рисуем на 1px ВНУТРИ через after:inset-px.
const headerButtonBase = cn(
  "relative inline-flex items-center rounded-xl border border-transparent bg-transparent transition-colors duration-200 ease-out",
  "after:pointer-events-none after:absolute after:inset-px after:rounded-[11px] after:border after:border-[var(--header-border)] after:content-['']",
  "after:transition-colors after:duration-200 after:ease-out",
  focusRingBase,
  "motion-reduce:transition-none motion-reduce:duration-0",
);

const pillBase = cn(
  "relative inline-flex h-10 w-full items-center justify-center rounded-xl px-3 border border-transparent bg-transparent",
  "after:pointer-events-none after:absolute after:inset-px after:rounded-[11px] after:border after:border-transparent after:content-['']",
  "after:transition-colors after:duration-200 after:ease-out",
  "text-muted-foreground no-underline transition-colors duration-200 ease-out",
  "hover:after:border-[var(--header-border)] hover:bg-transparent hover:text-foreground",
  "focus-visible:after:border-[var(--header-border)]",
  focusRingBase,
  "truncate motion-reduce:transition-none motion-reduce:duration-0",
);

const CONTACT_SLOT_WIDTHS = {
  phone: HEADER_TOP_STABLE_SLOTS.phone,
  email: HEADER_TOP_STABLE_SLOTS.email,
  telegram: HEADER_TOP_STABLE_SLOTS.telegram,
};

const DESKTOP_HOVER_SUPPRESS_STORAGE_KEY = "intema_desktop_hover_suppress_v2";

const INERT_FALLBACK_ATTR = "data-inert-fallback";
const INERT_FALLBACK_PREV_TABINDEX_ATTR = "data-inert-prev-tabindex";
const INERT_FALLBACK_PREV_TABINDEX_MISSING = "__missing__";

const INERT_FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, object, embed, [contenteditable], [tabindex]:not([tabindex="-1"])';

function applyInertFallback(root: HTMLElement) {
  const focusables = Array.from(
    root.querySelectorAll<HTMLElement>(INERT_FOCUSABLE_SELECTOR),
  );

  for (const el of focusables) {
    if (el.hasAttribute(INERT_FALLBACK_PREV_TABINDEX_ATTR)) continue;

    const prevTabindex = el.getAttribute("tabindex");
    el.setAttribute(
      INERT_FALLBACK_PREV_TABINDEX_ATTR,
      prevTabindex === null ? INERT_FALLBACK_PREV_TABINDEX_MISSING : prevTabindex,
    );
    el.setAttribute("tabindex", "-1");
  }

  const active = document.activeElement;
  if (active instanceof HTMLElement && root.contains(active)) {
    active.blur();
  }
}

function removeInertFallback(root: HTMLElement) {
  const processed = Array.from(
    root.querySelectorAll<HTMLElement>(`[${INERT_FALLBACK_PREV_TABINDEX_ATTR}]`),
  );

  for (const el of processed) {
    const currentTabindex = el.getAttribute("tabindex");
    const prevTabindex = el.getAttribute(INERT_FALLBACK_PREV_TABINDEX_ATTR);

    el.removeAttribute(INERT_FALLBACK_PREV_TABINDEX_ATTR);

    // Если tabindex был изменён кем-то ещё, пока элемент был "инертным",
    // не перетираем актуальное значение.
    if (currentTabindex !== "-1") {
      continue;
    }

    if (prevTabindex === null || prevTabindex === INERT_FALLBACK_PREV_TABINDEX_MISSING) {
      el.removeAttribute("tabindex");
    } else {
      el.setAttribute("tabindex", prevTabindex);
    }
  }
}

type DesktopHoverSuppressRecord = {
  id: string;
  x: number;
  y: number;
};

type SkipToContentLinkProps = {
  label: string;
};

function SkipToContentLink({ label }: SkipToContentLinkProps) {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:not-sr-only focus-visible:rounded focus-visible:bg-[color:var(--color-brand-600)] focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand-600)]"
    >
      {label}
    </a>
  );
}

export function SiteShell({
  locale,
  targetLocale,
  site,
  navigation,
  switcherHref,
  currentPath,
  children,
  footer,
}: SiteShellProps) {
  const brandName = site.name?.trim() ?? "";
  const dictionary = getInterfaceDictionary(locale);
  const skipLinkLabel = dictionary.common.skipToContent;
  const navigationLabels = dictionary.navigation;
  const switchToLabels = dictionary.languageSwitcher.switchTo;

  const brandLabel = brandName || "Интема Групп";

  const menuDialogLabel = locale === "ru" ? "Меню" : "Menu";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [desktopDropdownId, setDesktopDropdownId] = useState<string | null>(null);
  const [isDesktopDropdownMounted, setIsDesktopDropdownMounted] = useState(false);
  const desktopDropdownCloseTimerRef = useRef<number | null>(null);

  const desktopDropdownOpenTimerRef = useRef<number | null>(null);

  const initialDesktopHoverSuppressId = useMemo(() => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.sessionStorage.getItem(DESKTOP_HOVER_SUPPRESS_STORAGE_KEY);
      if (!raw) return null;

      const record = JSON.parse(raw) as Partial<DesktopHoverSuppressRecord>;
      return typeof record.id === "string" ? record.id : null;
    } catch {
      return null;
    }
  }, []);

  const desktopHoverSuppressForIdRef = useRef<string | null>(initialDesktopHoverSuppressId);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const prevPathRef = useRef(currentPath);
  const menuPanelRef = useRef<HTMLElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const {
    prefersReducedMotion,
    hasHydrated,
    isBurgerMode,
    isSmUp,
    navHostRef,
    navMeasureRef,
  } = useMediaBreakpoints();
  const transitionsOn = useResizeTransitions();

  const clearDesktopDropdownClose = useCallback(() => {
    const t = desktopDropdownCloseTimerRef.current;
    if (t) {
      window.clearTimeout(t);
      desktopDropdownCloseTimerRef.current = null;
    }
  }, []);

  const clearDesktopDropdownOpen = useCallback(() => {
    const t = desktopDropdownOpenTimerRef.current;
    if (t) {
      window.clearTimeout(t);
      desktopDropdownOpenTimerRef.current = null;
    }
  }, []);

  const closeDesktopDropdown = useCallback(() => {
    clearDesktopDropdownClose();
    clearDesktopDropdownOpen();
    setDesktopDropdownId(null);
  }, [clearDesktopDropdownClose, clearDesktopDropdownOpen]);

  const scheduleDesktopDropdownClose = useCallback(() => {
    clearDesktopDropdownClose();
    clearDesktopDropdownOpen();
    const delay = prefersReducedMotion ? 0 : 160;
    desktopDropdownCloseTimerRef.current = window.setTimeout(() => {
      setDesktopDropdownId(null);
    }, delay);
  }, [clearDesktopDropdownClose, clearDesktopDropdownOpen, prefersReducedMotion]);

  // Keep a "mounted" flag for the desktop dropdown so we can apply the
  // header separator / shadow during the closing animation as well.
  useEffect(() => {
    if (desktopDropdownId) {
      setIsDesktopDropdownMounted(true);
      return;
    }

    if (!isDesktopDropdownMounted) return;

    const duration = prefersReducedMotion ? 0 : DESKTOP_DROPDOWN_CLOSE_MS;
    const t = window.setTimeout(() => setIsDesktopDropdownMounted(false), duration);
    return () => window.clearTimeout(t);
  }, [desktopDropdownId, isDesktopDropdownMounted, prefersReducedMotion]);

  // --- Apple-like: hover intent delay + click guard ("предохранитель") ---

  // Apple-подобный предохранитель:
  // после клика по пункту меню с подменю блокируем hover-раскрытие ИМЕННО
  // для этого пункта, пока курсор не уйдёт с него.
  const clearDesktopHoverSuppression = useCallback(() => {
    desktopHoverSuppressForIdRef.current = null;
    try {
      window.sessionStorage.removeItem(DESKTOP_HOVER_SUPPRESS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const restoreDesktopHoverSuppression = useCallback(() => {
    let record: DesktopHoverSuppressRecord | null = null;

    try {
      const raw = window.sessionStorage.getItem(DESKTOP_HOVER_SUPPRESS_STORAGE_KEY);
      if (!raw) return;
      record = JSON.parse(raw) as DesktopHoverSuppressRecord;
    } catch {
      clearDesktopHoverSuppression();
      return;
    }

    if (!record || typeof record.id !== "string") {
      clearDesktopHoverSuppression();
      return;
    }

    // По умолчанию включаем предохранитель: лучше лишний раз не раскрыть меню,
    // чем раскрыть его сразу после клика/навигации.
    desktopHoverSuppressForIdRef.current = record.id;

    const pt = lastPointerPosRef.current ?? { x: record.x, y: record.y };
    if (typeof pt?.x !== "number" || typeof pt?.y !== "number") return;

    const el = document.elementFromPoint(pt.x, pt.y) as HTMLElement | null;
    const trigger = el?.closest("[data-nav-trigger]") as HTMLElement | null;
    const hoveredId = trigger?.getAttribute("data-nav-trigger");

    if (hoveredId && hoveredId !== record.id) {
      // Курсор уже не над тем пунктом — снимаем предохранитель.
      clearDesktopHoverSuppression();
    }
  }, [clearDesktopHoverSuppression]);

  // Трекаем координаты курсора + снимаем предохранитель, как только курсор ушёл
  // с кликнутого пункта меню.
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      lastPointerPosRef.current = { x: event.clientX, y: event.clientY };

      const suppressedId = desktopHoverSuppressForIdRef.current;
      if (!suppressedId) return;

      const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const trigger = el?.closest("[data-nav-trigger]") as HTMLElement | null;
      const hoveredId = trigger?.getAttribute("data-nav-trigger");

      if (hoveredId === suppressedId) return;

      clearDesktopHoverSuppression();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [clearDesktopHoverSuppression]);

  // После навигации (и после гидрации) восстанавливаем предохранитель,
  // если курсор всё ещё находится над пунктом меню, по которому кликнули.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => restoreDesktopHoverSuppression());
    return () => window.cancelAnimationFrame(frame);
  }, [currentPath, restoreDesktopHoverSuppression]);

  const handleHeaderPointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (isBurgerMode || isMenuOpen) return;

      const target = event.target as HTMLElement | null;
      const trigger = target?.closest(
        '[data-nav-trigger][data-nav-has-children="true"]',
      ) as HTMLElement | null;
      if (!trigger) return;

      const triggerId = trigger.getAttribute("data-nav-trigger");
      if (!triggerId) return;

      desktopHoverSuppressForIdRef.current = triggerId;
      lastPointerPosRef.current = { x: event.clientX, y: event.clientY };

      try {
        const record: DesktopHoverSuppressRecord = {
          id: triggerId,
          x: event.clientX,
          y: event.clientY,
        };
        window.sessionStorage.setItem(
          DESKTOP_HOVER_SUPPRESS_STORAGE_KEY,
          JSON.stringify(record),
        );
      } catch {
        // ignore
      }

      closeDesktopDropdown();
    },
    [closeDesktopDropdown, isBurgerMode, isMenuOpen],
  );

  const handleDesktopNavLinkPointerEnter = useCallback(
    (link: NavigationLink) => {
      if (isBurgerMode || isMenuOpen) return;

      // "Предохранитель" (как у Apple): после клика по пункту меню
      // его hover-раскрытие заблокировано, пока курсор не уйдёт с него.
      if (desktopHoverSuppressForIdRef.current === link.id) return;

      clearDesktopDropdownClose();
      clearDesktopDropdownOpen();

      const hasChildren = Boolean(link.children?.length);

      if (!hasChildren) {
        setDesktopDropdownId(null);
        return;
      }

      // Если меню уже открыто — переключаемся сразу (без задержки hover-intent).
      if (desktopDropdownId) {
        setDesktopDropdownId(link.id);
        return;
      }

      const delay = prefersReducedMotion ? 0 : DESKTOP_DROPDOWN_HOVER_OPEN_DELAY_MS;
      desktopDropdownOpenTimerRef.current = window.setTimeout(() => {
        desktopDropdownOpenTimerRef.current = null;
        if (desktopHoverSuppressForIdRef.current === link.id) return;
        setDesktopDropdownId(link.id);
      }, delay);
    },
    [
      clearDesktopDropdownClose,
      clearDesktopDropdownOpen,
      desktopDropdownId,
      isBurgerMode,
      isMenuOpen,
      prefersReducedMotion,
    ],
  );

  const handleDesktopNavLinkFocus = useCallback(
    (link: NavigationLink) => {
      if (isBurgerMode || isMenuOpen) return;

      // Для клавиатуры (focus) — без hover-intent задержки.
      clearDesktopDropdownClose();
      clearDesktopDropdownOpen();

      if (link.children?.length) {
        setDesktopDropdownId(link.id);
      } else {
        setDesktopDropdownId(null);
      }
    },
    [clearDesktopDropdownClose, clearDesktopDropdownOpen, isBurgerMode, isMenuOpen],
  );

  const inertProps = useCallback(
    (enabled: boolean): HTMLAttributes<HTMLElement> =>
      enabled
        ? ({
            inert: true,
            [INERT_FALLBACK_ATTR]: "true",
          } as HTMLAttributes<HTMLElement>)
        : {},
    [],
  );

  const inertFallbackRegistryRef = useRef(new Map<HTMLElement, MutationObserver>());

  const {
    basePath,
    contactsHref,
    ctaLabel,
    ctaCompactLabel,
    topContactsIds,
    topContactsWidth,
  } = useMemo(() => {
    const basePathRaw = buildPath(locale);
    const basePath =
      basePathRaw !== "/" && basePathRaw.endsWith("/")
        ? basePathRaw.slice(0, -1)
        : basePathRaw;
    const contactsHref = basePath === "/" ? "/contacts" : `${basePath}/contacts`;
    const ctaLabel = locale === "ru" ? "Оставить заявку" : "Send inquiry";
    const ctaCompactLabel = locale === "ru" ? "Оставить заявку" : "Send inquiry";

    const topContactsIds = [
      site.contacts.phone ? ("phone" as const) : null,
      site.contacts.email ? ("email" as const) : null,
    ].filter(Boolean) as Array<"phone" | "email">;

    const topContactsWidth =
      topContactsIds.reduce(
        (acc, id) => acc + (HEADER_TOP_STABLE_SLOTS[id] ?? 0),
        0,
      ) + (topContactsIds.length > 1 ? 36 : 0);

    return {
      basePath,
      contactsHref,
      ctaLabel,
      ctaCompactLabel,
      topContactsIds,
      topContactsWidth,
    } as const;
  }, [locale, site.contacts.email, site.contacts.phone]);

  const hasTopContacts = topContactsIds.length > 0;

  const telegramHref = (site.contacts.telegramUrl?.trim() || "https://t.me/IntemaGroup").trim();
  const telegramLabel = formatTelegramHandle(telegramHref) ?? "@IntemaGroup";

  const { scrollSentinelRef, isHeaderElevated } = useScrollElevation();
  // Высоту шапки держим стабильной через CSS-токен --header-height-initial,
  // чтобы контент под ней (и панели меню) не "прыгали" при смене режимов.
  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleBurgerClick = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const { topLineTransform, bottomLineTransform } = useBurgerAnimation({
    isMenuOpen,
    isBurgerMode,
    prefersReducedMotion,
    onRequestClose: handleCloseMenu,
  });

  useEffect(() => {
    if (prevPathRef.current === currentPath) return;

    prevPathRef.current = currentPath;

    // закрываем подменю на десктопе при навигации
    closeDesktopDropdown();

    if (!isMenuOpen) return;

    const frame = window.requestAnimationFrame(() => setIsMenuOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [closeDesktopDropdown, currentPath, isMenuOpen]);

  useWindowResize(
    () => {
      if (isBurgerMode || !isMenuOpen) return;
      handleCloseMenu();
    },
  );

  const [isMenuMounted, setIsMenuMounted] = useState(false);

  const isMenuModal = isBurgerMode && (isMenuOpen || isMenuMounted);

  // Fallback для inert: гарантируем, что "инертные" области не попадают в tab-order
  // даже в окружениях, где inert ведёт себя неоднородно.
  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    if (typeof MutationObserver === "undefined") return;

    const registry = inertFallbackRegistryRef.current;
    const inertRoots = new Set(
      Array.from(document.querySelectorAll<HTMLElement>(`[${INERT_FALLBACK_ATTR}]`)),
    );

    for (const root of inertRoots) {
      applyInertFallback(root);

      if (registry.has(root)) continue;
      const observer = new MutationObserver(() => applyInertFallback(root));
      observer.observe(root, { subtree: true, childList: true });
      registry.set(root, observer);
    }

    for (const [root, observer] of Array.from(registry.entries())) {
      if (root.isConnected && inertRoots.has(root)) continue;
      observer.disconnect();
      registry.delete(root);
      removeInertFallback(root);
    }
  }, [hasHydrated, isBurgerMode, isMenuModal, isMenuOpen]);

  useEffect(() => {
    return () => {
      const registry = inertFallbackRegistryRef.current;
      for (const [root, observer] of Array.from(registry.entries())) {
        observer.disconnect();
        removeInertFallback(root);
      }
      registry.clear();
    };
  }, []);

  // ВАЖНО: чтобы первое раскрытие бургер-меню не было "мгновенным",
  // держим панель закрытой на первом кадре после монтирования,
  // а затем (в rAF) переводим в открытое состояние — так transition по height гарантированно сработает.
  const [menuPanelOpenReady, setMenuPanelOpenReady] = useState(false);

  const [menuContentPhase, setMenuContentPhase] = useState<0 | 1>(0);

  useEffect(() => {
    if (!isBurgerMode) {
      const frame = window.requestAnimationFrame(() => setIsMenuMounted(false));
      return () => window.cancelAnimationFrame(frame);
    }

    if (isMenuOpen) {
      const frame = window.requestAnimationFrame(() => setIsMenuMounted(true));
      return () => window.cancelAnimationFrame(frame);
    }

    if (!isMenuMounted) return;

    const duration = prefersReducedMotion ? 0 : BURGER_MENU_CLOSE_MS;
    const t = window.setTimeout(() => setIsMenuMounted(false), duration);
    return () => window.clearTimeout(t);
  }, [isBurgerMode, isMenuOpen, isMenuMounted, prefersReducedMotion]);

  const isMenuModal = isBurgerMode && (isMenuOpen || isMenuMounted);

  // Подготавливаем height-анимацию панели бургер-меню:
  // при открытии сначала монтируем/показываем панель в закрытом состоянии,
  // затем в следующем кадре включаем открытое — чтобы transition сработал даже при первом открытии.
  useEffect(() => {
    if (!isBurgerMode) {
      setMenuPanelOpenReady(false);
      return;
    }

    if (!isMenuOpen) {
      setMenuPanelOpenReady(false);
      return;
    }

    setMenuPanelOpenReady(false);

    if (prefersReducedMotion) {
      setMenuPanelOpenReady(true);
      return;
    }

    const raf = window.requestAnimationFrame(() => setMenuPanelOpenReady(true));
    return () => window.cancelAnimationFrame(raf);
  }, [isBurgerMode, isMenuOpen, prefersReducedMotion]);

  // Фаза контента бургер-меню: сначала раскрываем панель, затем (чуть позже) запускаем
  // появление текста — как в mega-menu на десктопе.
  useEffect(() => {
    if (!isBurgerMode || !isMenuOpen) {
      setMenuContentPhase(0);
      return;
    }

    setMenuContentPhase(0);

    if (prefersReducedMotion) {
      setMenuContentPhase(1);
      return;
    }

    const t = window.setTimeout(() => setMenuContentPhase(1), BURGER_MENU_TEXT_ENTER_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [isBurgerMode, isMenuOpen, prefersReducedMotion]);

  const burgerMenuItemsVisible = isMenuOpen && menuContentPhase === 1;
  const isBurgerMenuClosing = isMenuMounted && !isMenuOpen;

  const getBurgerItemMotion = useCallback(
    (index: number): { className: string; style: CSSProperties } => {
      if (prefersReducedMotion) return { className: "", style: {} };

      const itemDelay = isMenuOpen ? index * BURGER_MENU_TEXT_STAGGER_MS : 0;
      const itemDuration = isMenuOpen ? BURGER_MENU_TEXT_ENTER_MS : BURGER_MENU_TEXT_EXIT_MS;

      const style: CSSProperties = {
        transitionDelay: `${itemDelay}ms`,
        transitionDuration: `${itemDuration}ms`,
        transitionTimingFunction: isMenuOpen
          ? "cubic-bezier(0.16,1,0.3,1)"
          : "cubic-bezier(0.2,0,0.38,0.9)",
      };

      const className = cn(
        "will-change-[opacity,transform]",
        "transition-[opacity,transform]",
        burgerMenuItemsVisible
          ? "opacity-100 translate-y-0"
          : isBurgerMenuClosing
            ? "opacity-0 translate-y-0"
            : "opacity-0 translate-y-4",
      );

      return { className, style };
    },
    [burgerMenuItemsVisible, isBurgerMenuClosing, isMenuOpen, prefersReducedMotion],
  );

  // Разделительная линия в шапке должна появляться:
  // - при скролле (как сейчас)
  // - при открытии mega-menu / бургер-меню даже в верхней точке страницы
  // При этом тень НЕ должна "лежать" поверх выезжающего меню — меню должно быть поверх.
  const isHeaderDividerVisible =
    isHeaderElevated || isDesktopDropdownMounted || isMenuModal;

  // Тень показываем только когда шапка "приподнята" скроллом и нет открытых панелей.
  const shouldShowHeaderShadow =
    isHeaderElevated && !isDesktopDropdownMounted && !isMenuModal;

  // Линия: мягко появляется, быстро исчезает.
  const headerDividerDurationMs = isHeaderDividerVisible ? 220 : 120;

  useEffect(() => {
    if (isBurgerMode || isMenuOpen) {
      closeDesktopDropdown();
    }
  }, [closeDesktopDropdown, isBurgerMode, isMenuOpen]);
  const normalizedCurrentPath = useMemo(() => normalizePathname(currentPath), [currentPath]);

  const isActiveHref = useCallback(
    (href: string): boolean => {
      const resolved = resolveHref(href);
      const normalizedHref = normalizePathname(resolved);
      return (
        normalizedHref === normalizedCurrentPath ||
        (normalizedHref !== "/" && normalizedCurrentPath.startsWith(`${normalizedHref}/`))
      );
    },
    [normalizedCurrentPath],
  );

  const productsLink = useMemo(
    () => navigation.header.find((l) => l.id === "products") ?? null,
    [navigation.header],
  );

  const productsHrefRoot = useMemo(() => {
    const href = (productsLink?.href ?? "/products").trim() || "/products";
    return href;
  }, [productsLink]);

  const isProductsActive = useMemo(
    () => isActiveHref(productsHrefRoot),
    [isActiveHref, productsHrefRoot],
  );

  // Подменю «Продукция»: берём из Keystatic (children), иначе — fallback
  const productsBaseHref = useMemo(
    () => productsHrefRoot.replace(/\/+$/, ""),
    [productsHrefRoot],
  );

  const productsSubLinks = useMemo<NavigationLink[]>(() => {
    const fromKeystatic = productsLink?.children;
    if (fromKeystatic?.length) {
      return fromKeystatic;
    }

    const catalogHref = basePath === "/" ? "/catalog" : `${basePath}/catalog`;

    return [
      {
        id: "products-binders",
        label: locale === "ru" ? "Литейные связующие" : "Binders",
        href: `${productsBaseHref}/binders`,
        isExternal: false,
        newTab: false,
      },
      {
        id: "products-coatings",
        label: locale === "ru" ? "Противопригарные покрытия" : "Coatings",
        href: `${productsBaseHref}/coatings`,
        isExternal: false,
        newTab: false,
      },
      {
        id: "products-auxiliaries",
        label: locale === "ru" ? "Вспомогательные материалы" : "Auxiliary materials",
        href: `${productsBaseHref}/auxiliaries`,
        isExternal: false,
        newTab: false,
      },
      {
        id: "products-catalog",
        label: locale === "ru" ? "Каталог" : "Catalog",
        href: catalogHref,
        isExternal: false,
        newTab: false,
      },
    ];
  }, [basePath, locale, productsBaseHref, productsLink?.children]);

  const activeProductsSubId = useMemo(() => {
    const active = productsSubLinks.find((item) => !item.isExternal && isActiveHref(item.href));
    return active?.id ?? "";
  }, [isActiveHref, productsSubLinks]);

  const isProductsRootActive = isProductsActive && !activeProductsSubId;

  const aboutLink = useMemo(
    () => navigation.header.find((l) => l.id === "about") ?? null,
    [navigation.header],
  );

  const aboutHrefRoot = useMemo(() => {
    const href = (aboutLink?.href ?? "/about").trim() || "/about";
    return href;
  }, [aboutLink]);

  const aboutSubLinks = useMemo<NavigationLink[]>(() => {
    const fromKeystatic = aboutLink?.children;
    if (fromKeystatic?.length) {
      return fromKeystatic;
    }

    const documentsHref = basePath === "/" ? "/documents" : `${basePath}/documents`;
    const privacyHref = basePath === "/" ? "/privacy-policy" : `${basePath}/privacy-policy`;

    return [
      {
        id: "about-documents",
        label: locale === "ru" ? "Документы" : "Documents",
        href: documentsHref,
        isExternal: false,
        newTab: false,
      },
      {
        id: "about-privacy",
        label: locale === "ru" ? "Политика ПДн" : "Privacy Policy",
        href: privacyHref,
        isExternal: false,
        newTab: false,
      },
    ];
  }, [aboutLink?.children, basePath, locale]);

  const activeAboutSubId = useMemo(() => {
    const active = aboutSubLinks.find((item) => !item.isExternal && isActiveHref(item.href));
    return active?.id ?? "";
  }, [aboutSubLinks, isActiveHref]);

  const isAboutMenuActive = useMemo(() => {
    if (!aboutLink) return false;
    return Boolean(activeAboutSubId) || isActiveHref(aboutHrefRoot);
  }, [aboutHrefRoot, aboutLink, activeAboutSubId, isActiveHref]);

  // Модальное меню: блокируем скролл фона, закрываем по Esc и удерживаем фокус внутри панели
  useEffect(() => {
    if (!isMenuModal) return;

    lastActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyWidth = document.body.style.width;
    const prevBodyTop = document.body.style.top;

    const scrollY = window.scrollY;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${scrollY}px`;

    const focusFirst = () => {
      const container = menuPanelRef.current;
      if (!container) return;
      // Не уводим фокус на первую кнопку/ссылку (иначе появляется «как баг» яркая обводка).
      // Вместо этого фокусируем контейнер: табуляция всё равно попадёт в первый пункт меню.
      container.focus();
    };

    const raf = window.requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCloseMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const container = menuPanelRef.current;
      if (!container) return;

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusables.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.width = prevBodyWidth;
      document.body.style.top = prevBodyTop;

      if (scrollY) {
        window.scrollTo({ top: scrollY });
      }
      document.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(raf);

      const prev = lastActiveElementRef.current;
      if (prev) {
        window.requestAnimationFrame(() => prev.focus());
      }
    };
  }, [isMenuModal, handleCloseMenu]);

  const shellTransitionClass = transitionsOn
    ? "transition-[padding-top] duration-200 ease-out"
    : "transition-none";

  let burgerMotionIndex = 0;
  const nextBurgerMotionIndex = () => burgerMotionIndex++;

  return (
    <div
      className={cn(
        "theme-transition relative flex min-h-screen flex-col bg-background text-foreground",
        shellTransitionClass,
        "motion-reduce:transition-none motion-reduce:duration-0",
      )}
      style={{
        "--header-height": "var(--header-height-initial)",
        paddingTop: "var(--header-height)",
      } as CSSProperties}
    >
      <HtmlLangSync initialLocale={locale} />
      <SkipToContentLink label={skipLinkLabel} />

      <div
        ref={scrollSentinelRef}
        className="absolute inset-x-0 top-0 h-2 w-px"
        aria-hidden
      />

      <header
        data-site-header
        onPointerDownCapture={handleHeaderPointerDownCapture}
        style={
          {
            "--header-divider-duration": `${headerDividerDurationMs}ms`,
          } as CSSProperties
        }
        className={cn(
          "fixed inset-x-0 top-0 z-[60] backdrop-blur before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:block before:h-px before:bg-[color:var(--header-border)] before:opacity-0 before:transition-opacity before:duration-[var(--header-divider-duration)] before:ease-out before:content-['']",
          "transition-[box-shadow,background-color,backdrop-filter] duration-200 ease-out",
          "motion-reduce:transition-none motion-reduce:duration-0",
          "h-[var(--header-height-initial)]",
          isHeaderDividerVisible
            ? cn(
                "bg-background/92 backdrop-blur-md before:opacity-100",
                shouldShowHeaderShadow && "shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
              )
            : "bg-background/80 backdrop-blur",
        )}
      >
        <div className="relative pt-[var(--safe-area-top)]">
          <div className="mx-auto w-full max-w-screen-2xl">
            <div
              className={cn(
                "flex w-full items-center justify-between",
                "gap-[var(--header-gap-x)] px-[var(--header-pad-x)] py-[var(--header-pad-y)]",
                "lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-stretch lg:gap-x-6",
              )}
            >
              <HeaderBrand href={basePath} label={brandLabel} />

              <div
                className={cn(
                  "w-full min-w-0",
                  // Фиксируем высоты строк, чтобы при переключении wagons
                  // не происходило скачков высоты хедера и контента.
                  "grid grid-rows-[var(--header-row-top-h)_var(--header-row-bottom-h)] gap-y-[var(--header-rows-gap)]",
                  "lg:justify-self-end lg:max-w-[var(--header-rail-w)]",
                )}
              >
                <HeaderTopBar
                  contacts={site.contacts}
                  hasTopContacts={hasTopContacts}
                  topContactsWidth={topContactsWidth}
                  isBurgerMode={isBurgerMode}
                  isSmUp={isSmUp}
                  prefersReducedMotion={prefersReducedMotion}
                  inertProps={inertProps}
                  hasHydrated={hasHydrated}
                  contactsHref={contactsHref}
                  ctaLabel={ctaLabel}
                  locale={locale}
                  targetLocale={targetLocale}
                  switcherHref={switcherHref}
                  switchToLabels={switchToLabels}
                  classNames={{ headerButtonBase, pillBase }}
                />

                <HeaderNav
                  navHostRef={navHostRef}
                  navMeasureRef={navMeasureRef}
                  navigation={navigation}
                  navigationLabel={navigationLabels.headerLabel}
                  locale={locale}
                  currentPath={currentPath}
                  desktopDropdownId={isBurgerMode || isMenuOpen ? null : desktopDropdownId}
                  isBurgerMode={isBurgerMode}
                  hasHydrated={hasHydrated}
                  isMenuOpen={isMenuOpen}
                  onBurgerClick={handleBurgerClick}
                  topLineTransform={topLineTransform}
                  bottomLineTransform={bottomLineTransform}
                  prefersReducedMotion={prefersReducedMotion}
                  inertProps={inertProps}
                  contactsHref={contactsHref}
                  ctaLabel={ctaCompactLabel}
                  headerButtonBase={headerButtonBase}
                  onDesktopNavEnter={clearDesktopDropdownClose}
                  onDesktopNavLeave={scheduleDesktopDropdownClose}
                  onDesktopNavLinkEnter={handleDesktopNavLinkPointerEnter}
                  onDesktopNavLinkFocus={handleDesktopNavLinkFocus}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <HeaderDesktopDropdown
        links={navigation.header}
        activeId={isBurgerMode || isMenuOpen ? null : desktopDropdownId}
        currentPath={currentPath}
        prefersReducedMotion={prefersReducedMotion}
        closeLabel={locale === "ru" ? "Закрыть подменю" : "Close submenu"}
        onPanelEnter={clearDesktopDropdownClose}
        onPanelLeave={scheduleDesktopDropdownClose}
        onRequestClose={closeDesktopDropdown}
      />

      {isMenuModal ? (
        <aside
          id="site-menu"
          ref={menuPanelRef}
          tabIndex={-1}
          aria-hidden={!isMenuOpen}
          {...inertProps(!isMenuOpen)}
          className={cn(
            // Apple-like: "шторка" на весь экран под шапкой
            "fixed inset-x-0 z-[59] overflow-hidden",
            isHeaderElevated ? "bg-background/95 backdrop-blur-md" : "bg-background/90 backdrop-blur",
            "will-change-[height]",
            prefersReducedMotion
              ? "transition-none"
              : "transition-[height] ease-[cubic-bezier(0.16,1,0.3,1)]",
            "motion-reduce:transition-none motion-reduce:duration-0",
            isMenuOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          style={
            {
              top: "var(--header-height)",
              height:
                isMenuOpen && (prefersReducedMotion || menuPanelOpenReady)
                  ? "calc(100dvh - var(--header-height))"
                  : "0px",
              transitionDuration: `${prefersReducedMotion ? 0 : isMenuOpen ? BURGER_MENU_OPEN_MS : BURGER_MENU_CLOSE_MS}ms`,
            } as CSSProperties
          }
        >
          <nav aria-label={menuDialogLabel} className="h-full">
            <div className="mx-auto h-full w-full max-w-screen-2xl px-[var(--header-pad-x)] pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
              <div className="flex h-full min-h-0 flex-col">
                <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                  <ul className="m-0 list-none space-y-4 p-0">
                    <li>
                      {(() => {
                        const { className, style } = getBurgerItemMotion(nextBurgerMotionIndex());
                        return (
                          <div className={className} style={style}>
                            <Link
                              href={productsHrefRoot}
                              onClick={handleCloseMenu}
                              aria-current={isProductsRootActive ? "page" : undefined}
                              className={cn(
                                "group block w-full py-2",
                                "no-underline",
                                "font-[var(--font-heading)] text-[clamp(1.15rem,0.95rem+0.8vw,1.8rem)] font-medium leading-[1.12] tracking-[-0.01em]",
                                isProductsRootActive
                                  ? "text-foreground"
                                  : "text-muted-foreground transition-colors hover:text-foreground",
                                focusRingBase,
                              )}
                            >
                              <span className={navUnderlineSpanClass(isProductsRootActive, "menu")}>
                                {productsLink?.label ?? (locale === "ru" ? "Продукция" : "Products")}
                              </span>
                            </Link>
                          </div>
                        );
                      })()}

                      <ul className="m-0 mt-3 list-none space-y-2 p-0 pl-4">
                        {productsSubLinks.map((item) => {
                          const isActive = activeProductsSubId === item.id;
                          const itemHref = (item.href ?? "/").trim() || "/";
                          const itemIsExternal = item.newTab || item.isExternal || isExternalHref(itemHref);

                          const itemClassName = cn(
                            "group block w-full py-1.5",
                            "no-underline",
                            "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground transition-colors hover:text-foreground",
                            focusRingBase,
                          );

                          const motion = getBurgerItemMotion(nextBurgerMotionIndex());

                          return (
                            <li key={item.id} className={motion.className} style={motion.style}>
                              {itemIsExternal ? (
                                <a
                                  href={itemHref}
                                  target={item.newTab ? "_blank" : undefined}
                                  rel={item.newTab ? "noopener noreferrer" : undefined}
                                  aria-current={isActive ? "page" : undefined}
                                  className={itemClassName}
                                >
                                  <span className={navUnderlineSpanClass(isActive, "menu")}>{item.label}</span>
                                </a>
                              ) : (
                                <Link
                                  href={itemHref}
                                  onClick={handleCloseMenu}
                                  aria-current={isActive ? "page" : undefined}
                                  className={itemClassName}
                                >
                                  <span className={navUnderlineSpanClass(isActive, "menu")}>{item.label}</span>
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </li>

                    {navigation.header
                      .filter((l) => l.id !== "products")
                      .map((link) => {
                        const href = (link.href ?? "/").trim() || "/";
                        const isActive = isActiveHref(href);
                        const isExternal = link.newTab || isExternalHref(href);

                        if (link.id === "about" && aboutSubLinks.length > 0) {
                          const rootActive = isAboutMenuActive;

                          const rootClassName = cn(
                            "group block w-full py-2",
                            "no-underline",
                            "font-[var(--font-heading)] text-[clamp(1.15rem,0.95rem+0.8vw,1.8rem)] font-medium leading-[1.12] tracking-[-0.01em]",
                            rootActive
                              ? "text-foreground"
                              : "text-muted-foreground transition-colors hover:text-foreground",
                            focusRingBase,
                          );

                          return (
                            <li key={link.id}>
                              {(() => {
                                const { className, style } = getBurgerItemMotion(nextBurgerMotionIndex());
                                return (
                                  <div className={className} style={style}>
                                    {isExternal ? (
                                      <a
                                        href={href}
                                        target={link.newTab ? "_blank" : undefined}
                                        rel={link.newTab ? "noopener noreferrer" : undefined}
                                        aria-current={isActive ? "page" : undefined}
                                        className={rootClassName}
                                      >
                                        <span className={navUnderlineSpanClass(rootActive, "menu")}>{link.label}</span>
                                      </a>
                                    ) : (
                                      <Link
                                        href={href}
                                        onClick={handleCloseMenu}
                                        aria-current={isActive ? "page" : undefined}
                                        className={rootClassName}
                                      >
                                        <span className={navUnderlineSpanClass(rootActive, "menu")}>{link.label}</span>
                                      </Link>
                                    )}
                                  </div>
                                );
                              })()}

                              <ul className="m-0 mt-3 list-none space-y-2 p-0 pl-4">
                                {aboutSubLinks.map((item) => {
                                  const isSubActive = activeAboutSubId === item.id;
                                  const itemHref = (item.href ?? "/").trim() || "/";
                                  const itemIsExternal = item.newTab || item.isExternal || isExternalHref(itemHref);

                                  const itemClassName = cn(
                                    "group block w-full py-1.5",
                                    "no-underline",
                                    "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
                                    isSubActive
                                      ? "text-foreground"
                                      : "text-muted-foreground transition-colors hover:text-foreground",
                                    focusRingBase,
                                  );

                                  const motion = getBurgerItemMotion(nextBurgerMotionIndex());

                                  return (
                                    <li key={item.id} className={motion.className} style={motion.style}>
                                      {itemIsExternal ? (
                                        <a
                                          href={itemHref}
                                          target={item.newTab ? "_blank" : undefined}
                                          rel={item.newTab ? "noopener noreferrer" : undefined}
                                          aria-current={isSubActive ? "page" : undefined}
                                          className={itemClassName}
                                        >
                                          <span className={navUnderlineSpanClass(isSubActive, "menu")}>{item.label}</span>
                                        </a>
                                      ) : (
                                        <Link
                                          href={itemHref}
                                          onClick={handleCloseMenu}
                                          aria-current={isSubActive ? "page" : undefined}
                                          className={itemClassName}
                                        >
                                          <span className={navUnderlineSpanClass(isSubActive, "menu")}>{item.label}</span>
                                        </Link>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </li>
                          );
                        }

                        const rootMotion = getBurgerItemMotion(nextBurgerMotionIndex());

                        return (
                          <li key={link.id} className={rootMotion.className} style={rootMotion.style}>
                            {isExternal ? (
                              <a
                                href={href}
                                target={link.newTab ? "_blank" : undefined}
                                rel={link.newTab ? "noopener noreferrer" : undefined}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                  "group block w-full py-2",
                                  "no-underline",
                                  "font-[var(--font-heading)] text-[clamp(1.15rem,0.95rem+0.8vw,1.8rem)] font-medium leading-[1.12] tracking-[-0.01em]",
                                  isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground transition-colors hover:text-foreground",
                                  focusRingBase,
                                )}
                              >
                                <span className={navUnderlineSpanClass(isActive, "menu")}>{link.label}</span>
                              </a>
                            ) : (
                              <Link
                                href={href}
                                onClick={handleCloseMenu}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                  "group block w-full py-2",
                                  "no-underline",
                                  "font-[var(--font-heading)] text-[clamp(1.15rem,0.95rem+0.8vw,1.8rem)] font-medium leading-[1.12] tracking-[-0.01em]",
                                  isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground transition-colors hover:text-foreground",
                                  focusRingBase,
                                )}
                              >
                                <span className={navUnderlineSpanClass(isActive, "menu")}>{link.label}</span>
                              </Link>
                            )}
                          </li>
                        );
                      })}
                  </ul>

                  {site.contacts.email || (!isSmUp && telegramHref) ? (
                    <div className="mt-6">
                      {/* ✅ Оптическое выравнивание контактов по видимому тексту */}
                      <div className="flex flex-row flex-wrap items-center gap-2 -ml-3">
                        {site.contacts.email
                          ? (() => {
                              const motion = getBurgerItemMotion(nextBurgerMotionIndex());
                              return (
                                <div className={motion.className} style={motion.style}>
                                  <a
                                    href={`mailto:${site.contacts.email}`}
                                    className={pillBase}
                                    onClick={handleCloseMenu}
                                    style={{ width: `${CONTACT_SLOT_WIDTHS.email}px` }}
                                  >
                                    {site.contacts.email}
                                  </a>
                                </div>
                              );
                            })()
                          : null}

                        {!isSmUp
                          ? (() => {
                              const motion = getBurgerItemMotion(nextBurgerMotionIndex());
                              return (
                                <div className={motion.className} style={motion.style}>
                                  <a
                                    href={telegramHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={pillBase}
                                    onClick={handleCloseMenu}
                                    style={{ width: `${CONTACT_SLOT_WIDTHS.telegram}px` }}
                                  >
                                    {telegramLabel}
                                  </a>
                                </div>
                              );
                            })()
                          : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </nav>
        </aside>
      ) : null}

      <section
        id="main"
        role="main"
        tabIndex={-1}
        suppressHydrationWarning
        aria-hidden={isMenuModal ? true : undefined}
        {...inertProps(isMenuModal)}
        className="mx-auto w-full max-w-screen-2xl flex-1 space-y-12 px-[var(--header-pad-x)] py-10 sm:py-12"
      >
        {children}
      </section>

      <div aria-hidden={isMenuModal ? true : undefined} {...inertProps(isMenuModal)}>
        {footer}
      </div>
    </div>
  );
}
