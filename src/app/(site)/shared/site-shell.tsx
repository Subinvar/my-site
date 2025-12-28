"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { getInterfaceDictionary } from "@/content/dictionary";
import type { Navigation, SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";
import { buildPath } from "@/lib/paths";
import { cn } from "@/lib/cn";
import { navUnderlineSpanClass } from "@/lib/nav-underline";
import { HtmlLangSync } from "./html-lang-sync";
import { useMediaBreakpoints } from "./hooks/use-media-breakpoints";
import { useResizeTransitions } from "./hooks/use-resize-transitions";
import { useHeaderHeight } from "./hooks/use-header-height";
import { useBurgerAnimation } from "./hooks/use-burger-animation";
import { useScrollElevation } from "./hooks/use-scroll-elevation";
import { useWindowResize } from "./hooks/use-window-resize";
import { HeaderBrand } from "./header-brand";
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

const brandFont = { variable: "font-brand-var" };

const headerButtonBase =
  "inline-flex items-center rounded-xl border border-[var(--header-border)] bg-transparent transition-colors duration-200 ease-out focus-visible:border-[var(--header-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] motion-reduce:transition-none motion-reduce:duration-0";

const pillBase =
  "inline-flex h-10 w-full items-center justify-center rounded-xl px-3 border border-transparent bg-transparent text-muted-foreground no-underline transition-colors duration-200 ease-out hover:border-[var(--header-border)] hover:bg-transparent hover:text-foreground focus-visible:border-[var(--header-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] truncate motion-reduce:transition-none motion-reduce:duration-0";

const contactLinkBase =
  "inline-flex self-start h-10 items-center justify-center rounded-xl border border-transparent bg-transparent px-3 no-underline transition-colors duration-200 ease-out hover:border-[var(--header-border)] hover:bg-transparent hover:text-foreground focus-visible:border-[var(--header-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] text-muted-foreground motion-reduce:transition-none motion-reduce:duration-0";

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
  const prevPathRef = useRef(currentPath);
  const menuPanelRef = useRef<HTMLElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);


  const {
    prefersReducedMotion,
    hasHydrated,
    isBurgerMode,
    navHostRef,
    navMeasureRef,
  } = useMediaBreakpoints();
  const transitionsOn = useResizeTransitions();

  const inertProps = useCallback(
    (enabled: boolean): HTMLAttributes<HTMLElement> => (enabled ? { inert: true } : {}),
    [],
  );

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
  const { scrollSentinelRef, isHeaderElevated } = useScrollElevation();
  const { shellRef, headerRef } = useHeaderHeight();
  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleBurgerClick = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const {  
    topWagonIsBurger,
    topWagonsCollapsed,
    topLineTransform,
    bottomLineTransform,
  } = useBurgerAnimation({
    isMenuOpen,
    isBurgerMode,
    prefersReducedMotion,
    hasHydrated,
    onRequestClose: handleCloseMenu,
  });

  useEffect(() => {
    if (prevPathRef.current === currentPath) return;

    prevPathRef.current = currentPath;

    if (!isMenuOpen) return;

    const frame = window.requestAnimationFrame(() => setIsMenuOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [currentPath, isMenuOpen]);

  useWindowResize(
    () => {
      if (isBurgerMode || !isMenuOpen) return;
      handleCloseMenu();
    },
  );

  const [isMenuMounted, setIsMenuMounted] = useState(false);

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

    const duration = prefersReducedMotion ? 0 : 320;
    const t = window.setTimeout(() => setIsMenuMounted(false), duration);
    return () => window.clearTimeout(t);
  }, [isBurgerMode, isMenuOpen, isMenuMounted, prefersReducedMotion]);

  const isMenuModal = isBurgerMode && isMenuMounted;
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

  const productsHrefRoot = useMemo(() => {
    const href = (navigation.header.find((l) => l.id === "products")?.href ?? "/products").trim() || "/products";
    return href;
  }, [navigation.header]);

  const isProductsActive = useMemo(() => isActiveHref(productsHrefRoot), [isActiveHref, productsHrefRoot]);

      // Подменю «Продукция»: основные категории — отдельные страницы
  const productsBaseHref = useMemo(() => productsHrefRoot.replace(/\/+$/, ""), [productsHrefRoot]);

  const productsSubLinks = useMemo(
    () =>
      [
        {
          id: "binders" as const,
          label: locale === "ru" ? "Связующие" : "Binders",
          href: `${productsBaseHref}/binders`,
        },
        {
          id: "coatings" as const,
          label: locale === "ru" ? "Противопригарные покрытия" : "Coatings",
          href: `${productsBaseHref}/coatings`,
        },
        {
          id: "aux" as const,
          label: locale === "ru" ? "Вспомогательные материалы" : "Auxiliary materials",
          href: `${productsBaseHref}/auxiliaries`,
        },
      ] as const,
    [locale, productsBaseHref],
  );

  const activeProductsSubId = useMemo(() => {
    const active = productsSubLinks.find((item) => isActiveHref(item.href));
    return active?.id ?? "";
  }, [isActiveHref, productsSubLinks]);

  const isProductsRootActive = isProductsActive && !activeProductsSubId;

  // Модальное меню: блокируем скролл фона, закрываем по Esc и удерживаем фокус внутри панели
  useEffect(() => {
    if (!isMenuModal) return;

    lastActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
      document.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(raf);

      const prev = lastActiveElementRef.current;
      if (prev) {
        window.requestAnimationFrame(() => prev.focus());
      }
    };
  }, [isMenuModal, handleCloseMenu]);

  const {
    shellTransitionClass,
    wagonTransitionClass,
    slideTransitionClass,
    burgerDelayClass,
    topWagonWidthTransitionClass,
    wagonTransformClass,
    topWagonTransformClass,
    menuSlideClass,
    burgerSlideClass,
  } = useMemo(
    () => {
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

      return {
        shellTransitionClass,
        wagonTransitionClass,
        slideTransitionClass,
        burgerDelayClass,
        topWagonWidthTransitionClass,
        wagonTransformClass,
        topWagonTransformClass,
        menuSlideClass,
        burgerSlideClass,
      } as const;
    }, [hasHydrated, isBurgerMode, topWagonIsBurger, transitionsOn],
  );

  return (
    <div
      ref={shellRef}
      className={cn(
        brandFont.variable,
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
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-[60] backdrop-blur before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:block before:h-px before:bg-[color:var(--header-border)] before:opacity-0 before:transition-opacity before:duration-200 before:ease-out before:content-['']",
          "transition-[box-shadow,background-color,backdrop-filter] duration-200 ease-out",
          "motion-reduce:transition-none motion-reduce:duration-0",
          "min-h-[var(--header-height-initial)]",
          isHeaderElevated
            ? "bg-background/92 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md before:opacity-100"
            : "bg-background/80 backdrop-blur",
        )}
      >
        <div className="relative">
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
                  "grid grid-rows-[auto_auto] gap-y-2",
                  "lg:grid-rows-[minmax(40px,auto)_minmax(40px,auto)] lg:gap-y-2",
                  "lg:justify-self-end lg:max-w-[var(--header-rail-w)]",
                )}
              >
                <HeaderTopBar
                  contacts={site.contacts}
                  hasTopContacts={hasTopContacts}
                  topContactsWidth={topContactsWidth}
                  topWagonsCollapsed={topWagonsCollapsed}
                  topWagonIsBurger={topWagonIsBurger}
                  topWagonTransformClass={topWagonTransformClass}
                  topWagonWidthTransitionClass={topWagonWidthTransitionClass}
                  wagonTransitionClass={wagonTransitionClass}
                  slideTransitionClass={slideTransitionClass}
                  burgerDelayClass={burgerDelayClass}
                  menuSlideClass={menuSlideClass}
                  burgerSlideClass={burgerSlideClass}
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
                  isBurgerMode={isBurgerMode}
                  hasHydrated={hasHydrated}
                  isMenuOpen={isMenuOpen}
                  onBurgerClick={handleBurgerClick}
                  topLineTransform={topLineTransform}
                  bottomLineTransform={bottomLineTransform}
                  wagonTransitionClass={wagonTransitionClass}
                  wagonTransformClass={wagonTransformClass}
                  slideTransitionClass={slideTransitionClass}
                  menuSlideClass={menuSlideClass}
                  burgerSlideClass={burgerSlideClass}
                  burgerDelayClass={burgerDelayClass}
                  inertProps={inertProps}
                  contactsHref={contactsHref}
                  ctaLabel={ctaCompactLabel}
                  headerButtonBase={headerButtonBase}
                />
              </div>
            </div>
          </div>
        </div>

        
      </header>

      {isBurgerMode ? (
  <aside
    id="site-menu"
    ref={menuPanelRef}
    tabIndex={-1}
    aria-hidden={hasHydrated ? !isMenuOpen : undefined}
    {...inertProps(hasHydrated ? !isMenuOpen : false)}
    className={cn(
      // «Шторка» на весь экран под шапкой (Apple-подобный режим навигации)
      "fixed inset-x-0 z-[59]",
              isHeaderElevated
                ? "bg-background/95 backdrop-blur-md"
                : "bg-background/90 backdrop-blur",
      "transform-gpu will-change-transform",
      "transition-[opacity,transform] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
      "motion-reduce:transition-none motion-reduce:duration-0",
      isMenuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-8 opacity-0",
    )}
    style={{ top: "var(--header-height)", bottom: 0 } as CSSProperties}
  >
    <nav aria-label={menuDialogLabel} className="h-full">
      <div className="mx-auto h-full w-full max-w-screen-2xl px-[var(--header-pad-x)] pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <div className="flex h-full flex-col">
          <div className="relative flex-1 overflow-hidden">
            <ul className="m-0 list-none space-y-4 p-0">
              <li>
                <Link
                  href={productsHrefRoot}
                  onClick={handleCloseMenu}
                  aria-current={isProductsRootActive ? "page" : undefined}
                  className={cn(
                    "group block w-full py-2",
                    "no-underline",
                    "font-[var(--font-heading)] text-[clamp(1.35rem,1.05rem+1.2vw,2.05rem)] font-medium leading-[1.12] tracking-[-0.01em]",
                    isProductsRootActive
                      ? "text-foreground"
                      : "text-muted-foreground transition-colors hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]",
                    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  )}
                >
                  <span className={navUnderlineSpanClass(isProductsRootActive, "menu")}>
                    {navigation.header.find((l) => l.id === "products")?.label ??
                      (locale === "ru" ? "Продукция" : "Products")}
                  </span>
                </Link>

                <ul className="m-0 mt-3 list-none space-y-2 p-0 pl-4">
                  {productsSubLinks.map((item) => {
                    const isActive = activeProductsSubId === item.id;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={handleCloseMenu}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "group block w-full py-1.5",
                            "no-underline",
                            "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground transition-colors hover:text-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]",
                            "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                          )}
                        >
                          <span className={navUnderlineSpanClass(isActive, "menu")}>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

              </li>

              {(["news", "about", "partners", "contacts"] as const).map((id) => {
                const link = navigation.header.find((l) => l.id === id);
                if (!link) return null;

                const href = (link.href ?? "/").trim() || "/";
                const isActive = isActiveHref(href);
                const isExternal = link.newTab || isExternalHref(href);
                return (
                  <li key={link.id}>
                  {isExternal ? (
                    <a
                      href={href}
                      target={link.newTab ? "_blank" : undefined}
                      rel={link.newTab ? "noopener noreferrer" : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group block w-full py-2",
                        "no-underline",
                        "font-[var(--font-heading)] text-[clamp(1.35rem,1.05rem+1.2vw,2.05rem)] font-medium leading-[1.12] tracking-[-0.01em]",
                        isActive ? "text-foreground" : "text-muted-foreground transition-colors hover:text-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
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
                        "font-[var(--font-heading)] text-[clamp(1.35rem,1.05rem+1.2vw,2.05rem)] font-medium leading-[1.12] tracking-[-0.01em]",
                        isActive ? "text-foreground" : "text-muted-foreground transition-colors hover:text-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                      )}
                    >
                      <span className={navUnderlineSpanClass(isActive, "menu")}>{link.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* контакты — снизу, в том же оформлении, что и в шапке */}
        <div className="pt-10 text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]">
          <div className="flex flex-col items-start gap-2">
            {site.contacts.phone ? (
              <a
                href={`tel:${site.contacts.phone.replace(/[^+\d]/g, "")}`}
                className={contactLinkBase}
              >
                {site.contacts.phone}
              </a>
            ) : null}

            {site.contacts.email ? (
              <a href={`mailto:${site.contacts.email}`} className={contactLinkBase}>
                {site.contacts.email}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  </nav>
  </aside>
) : null}


      <main
        id="main"
        role="main"
        tabIndex={-1}
        aria-hidden={isMenuModal ? true : undefined}
        {...inertProps(isMenuModal)}
        className="mx-auto w-full max-w-screen-2xl flex-1 space-y-12 px-[var(--header-pad-x)] py-10 sm:py-12"
      >
        {children}
      </main>

      <div aria-hidden={isMenuModal ? true : undefined} {...inertProps(isMenuModal)}>
        {footer}
      </div>
    </div>
  );
}