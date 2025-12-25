"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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
import { HtmlLangSync } from "./html-lang-sync";
import { useMediaBreakpoints } from "./hooks/use-media-breakpoints";
import { useResizeTransitions } from "./hooks/use-resize-transitions";
import { useHeaderHeight } from "./hooks/use-header-height";
import { useBurgerAnimation } from "./hooks/use-burger-animation";
import { useScrollElevation } from "./hooks/use-scroll-elevation";
import { useWindowResize } from "./hooks/use-window-resize";
import { useScrollPosition } from "./hooks/use-scroll-position";
import { HeaderBrand } from "./header-brand";
import { HeaderNav } from "./header-nav";
import { HeaderTopBar, HEADER_TOP_STABLE_SLOTS, HeaderCta } from "./header-top-bar";
import { MenuOverlay } from "./menu-overlay";
import { SiteFooter } from "./site-footer";

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

const brandFont = { variable: "font-brand-var" };

const headerButtonBase =
  "inline-flex items-center rounded-xl border border-[var(--header-border)] bg-background/70 transition-colors duration-200 ease-out focus-visible:border-[var(--header-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] motion-reduce:transition-none motion-reduce:duration-0";

const pillBase =
  "inline-flex h-10 w-full items-center justify-center rounded-xl px-3 border border-transparent bg-background/70 text-muted-foreground no-underline transition-colors duration-200 ease-out hover:border-[var(--header-border)] hover:bg-background/80 hover:text-foreground focus-visible:border-[var(--header-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] truncate motion-reduce:transition-none motion-reduce:duration-0";

const contactLinkBase = "text-foreground no-underline hover:underline underline-offset-4";

type SkipToContentLinkProps = {
  label: string;
};

function SkipToContentLink({ label }: SkipToContentLinkProps) {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:not-sr-only focus-visible:rounded focus-visible:bg-brand-600 focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      ) + (topContactsIds.length > 1 ? 24 : 0);

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

  const openMenuLabel = locale === "ru" ? "Открыть меню" : "Open menu";
  const closeMenuLabel = locale === "ru" ? "Закрыть меню" : "Close menu";

  useEffect(() => {
    if (!isMenuOpen) return;

    const frame = window.requestAnimationFrame(() => setIsMenuOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [currentPath, isMenuOpen]);

  useScrollPosition(
    () => {
      if (!isBurgerMode || !isMenuOpen) return;
      handleCloseMenu();
    },
    { disabled: !isBurgerMode },
  );

  useWindowResize(
    () => {
      if (isBurgerMode || !isMenuOpen) return;
      handleCloseMenu();
    },
  );

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
              <HeaderBrand href={basePath} label={brandLabel} />

              <div
                className={cn(
                  "w-full min-w-0",
                  "grid grid-rows-[auto_auto] gap-y-2",
                  "lg:grid-rows-[minmax(40px,auto)_minmax(40px,auto)] lg:gap-y-2",
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
                  currentPath={currentPath}
                  isBurgerMode={isBurgerMode}
                  hasHydrated={hasHydrated}
                  isMenuOpen={isMenuOpen}
                  openMenuLabel={openMenuLabel}
                  closeMenuLabel={closeMenuLabel}
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
                headerButtonBase={headerButtonBase}
                href={contactsHref}
                label={ctaLabel}
                className="w-full justify-center"
              />
              <div className="flex flex-col gap-2 text-sm">
                {site.contacts.phone ? (
                  <a
                    href={`tel:${site.contacts.phone.replace(/[^+\d]/g, "")}`}
                    className={contactLinkBase}
                  >
                    {site.contacts.phone}
                  </a>
                ) : null}

                {site.contacts.email ? (
                  <a
                    href={`mailto:${site.contacts.email}`}
                    className={contactLinkBase}
                  >
                    {site.contacts.email}
                  </a>
                ) : null}
              </div>

              <HeaderNav
                navigation={navigation}
                navigationLabel={navigationLabels.headerLabel}
                currentPath={currentPath}
                isBurgerMode={false}
                hasHydrated={hasHydrated}
                isMenuOpen={isMenuOpen}
                openMenuLabel={openMenuLabel}
                closeMenuLabel={closeMenuLabel}
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
          </nav>
        ) : null}
      </header>

      <MenuOverlay
        isVisible={isBurgerMode && isMenuOpen}
        onClose={handleCloseMenu}
        closeMenuLabel={closeMenuLabel}
      />

      <main
        id="main"
        role="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      >
        {children}
      </main>

      <SiteFooter
        navigation={navigation}
        navigationLabel={navigationLabels.footerLabel}
        currentPath={currentPath}
        copyrightText={copyrightText}
      />
    </div>
  );
}

