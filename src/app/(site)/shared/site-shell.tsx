"use client";

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
import { HeaderTopBar, HEADER_TOP_STABLE_SLOTS } from "./header-top-bar";
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
  "inline-flex items-center rounded-xl border border-[var(--header-border)] bg-transparent transition-colors duration-200 ease-out focus-visible:border-[var(--header-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] motion-reduce:transition-none motion-reduce:duration-0";

const pillBase =
  "inline-flex h-10 w-full items-center justify-center rounded-xl px-3 border border-transparent bg-transparent text-muted-foreground no-underline transition-colors duration-200 ease-out hover:border-[var(--header-border)] hover:bg-transparent hover:text-foreground focus-visible:border-[var(--header-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] truncate motion-reduce:transition-none motion-reduce:duration-0";

const contactLinkBase = "text-foreground no-underline hover:underline underline-offset-4";

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
  currentYear,
  children,
}: SiteShellProps) {
  const brandName = site.name?.trim() ?? "";
  const dictionary = getInterfaceDictionary(locale);
  const skipLinkLabel = dictionary.common.skipToContent;
  const navigationLabels = dictionary.navigation;
  const switchToLabels = dictionary.languageSwitcher.switchTo;

  const brandLabel = brandName || "Интема Групп";

  const menuDialogLabel = locale === "ru" ? "Меню" : "Menu";

  const copyrightTemplate = site.footer?.copyright?.trim() ?? "";
  const copyrightText = copyrightTemplate.length
    ? copyrightTemplate
        .replaceAll("{year}", String(currentYear))
        .replaceAll("{siteName}", brandName)
    : "";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<"root" | "products">("root");
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

  useEffect(() => {
    if (isMenuOpen) setMenuView("root");
  }, [isMenuOpen]);

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

  useScrollPosition(
    () => {
      if (!isBurgerMode || !isMenuOpen) return;
      handleCloseMenu();
    },
    { disabled: !isBurgerMode, immediate: false },
  );

  useWindowResize(
    () => {
      if (isBurgerMode || !isMenuOpen) return;
      handleCloseMenu();
    },
  );

  const isMenuModal = isBurgerMode && isMenuOpen;

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
          "fixed inset-x-0 top-0 z-[60] backdrop-blur before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:block before:h-px before:bg-[color:var(--header-border)] before:opacity-100 before:transition-opacity before:duration-200 before:ease-out before:content-['']",
          "transition-[box-shadow,background-color,backdrop-filter] duration-200 ease-out",
          "motion-reduce:transition-none motion-reduce:duration-0",
          isHeaderElevated
            ? "bg-background/95 shadow-[0_14px_38px_rgba(0,0,0,0.12)] backdrop-blur-md"
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

        {isBurgerMode ? (
  <aside
    id="site-menu"
    ref={menuPanelRef}
    role="dialog"
    aria-modal="true"
    aria-label={menuDialogLabel}
    tabIndex={-1}
    aria-hidden={hasHydrated ? !isMenuModal : undefined}
    {...inertProps(hasHydrated ? !isMenuModal : false)}
    className={cn(
      // «Шторка» на весь экран под шапкой (Apple-подобный режим навигации)
      "fixed inset-x-0 z-[59]",
              isHeaderElevated
                ? "bg-background/95 backdrop-blur-md"
                : "bg-background/90 backdrop-blur",
      "transform-gpu will-change-transform",
      "transition-[opacity,transform] duration-300 ease-out",
      "motion-reduce:transition-none motion-reduce:duration-0",
      isMenuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0 invisible",
    )}
    style={{ top: "var(--header-height)", bottom: 0 } as CSSProperties}
  >
    <div className="mx-auto h-full w-full max-w-screen-2xl px-[var(--header-pad-x)] py-10">
      <div className="flex h-full flex-col">
        <div className="relative flex-1 overflow-hidden">
          <div
            className={cn(
              "flex h-full w-[200%]",
              "transform-gpu transition-transform duration-300 ease-out",
              "motion-reduce:transition-none motion-reduce:duration-0",
              menuView === "products" ? "-translate-x-1/2" : "translate-x-0",
            )}
          >
            {/* ROOT */}
            <div className="w-1/2 pr-6">
              <ul className="m-0 list-none space-y-4 p-0">
                <li>
                  <button
                    type="button"
                    onClick={() => setMenuView("products")}
                    className={cn(
                      "group flex w-full items-center justify-between py-2",
                      "no-underline",
                      "text-[clamp(1.7rem,1.2rem+1.6vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.02em]",
                      "text-foreground transition-opacity hover:opacity-80",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]",
                      "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                    )}
                  >
                    <span>
                      {navigation.header.find((l) => l.id === "products")?.label ??
                        (locale === "ru" ? "Продукция" : "Products")}
                    </span>
                    <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                      ›
                    </span>
                  </button>
                </li>

                {(["news", "about", "partners", "contacts"] as const).map((id) => {
                  const link = navigation.header.find((l) => l.id === id);
                  if (!link) return null;

                  const href = (link.href ?? "/").trim() || "/";
                  return (
                    <li key={link.id}>
                      <a
                        href={href}
                        target={link.newTab ? "_blank" : undefined}
                        rel={link.newTab ? "noopener noreferrer" : undefined}
                        onClick={handleCloseMenu}
                        className={cn(
                          "block w-full py-2",
                          "no-underline",
                          "text-[clamp(1.7rem,1.2rem+1.6vw,2.6rem)] font-semibold leading-[1.05] tracking-[-0.02em]",
                          "text-foreground transition-opacity hover:opacity-80",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]",
                          "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                        )}
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* PRODUCTS */}
            <div className="w-1/2 pl-6">
              <button
                type="button"
                onClick={() => setMenuView("root")}
                className={cn(
                  "mb-8 inline-flex items-center gap-2",
                  "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
                  "text-muted-foreground no-underline hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                )}
              >
                <span className="text-lg">‹</span>
                {locale === "ru" ? "Назад" : "Back"}
              </button>

              {(() => {
                const productsHref =
                  (navigation.header.find((l) => l.id === "products")?.href ?? "/products").trim() ||
                  "/products";

                const items = [
                  {
                    id: "binders",
                    label: locale === "ru" ? "Связующие" : "Binders",
                    href: `${productsHref}#binders`,
                  },
                  {
                    id: "coatings",
                    label: locale === "ru" ? "Противопригарные покрытия" : "Coatings",
                    href: `${productsHref}#coatings`,
                  },
                  {
                    id: "aux",
                    label:
                      locale === "ru" ? "Вспомогательные материалы" : "Auxiliary materials",
                    href: `${productsHref}#aux`,
                  },
                ] as const;

                return (
                  <ul className="m-0 list-none space-y-4 p-0">
                    {items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.href}
                          onClick={handleCloseMenu}
                          className={cn(
                            "block w-full py-2",
                            "no-underline",
                            "text-[clamp(1.45rem,1.05rem+1.2vw,2.1rem)] font-semibold leading-[1.1] tracking-[-0.02em]",
                            "text-foreground transition-opacity hover:opacity-80",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]",
                            "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                          )}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}

                    <li className="pt-6">
                      <a
                        href={productsHref}
                        onClick={handleCloseMenu}
                        className={cn(
                          "inline-flex",
                          "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
                          "text-muted-foreground no-underline hover:text-foreground hover:underline underline-offset-4",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)]",
                          "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                        )}
                      >
                        {locale === "ru" ? "Все продукты" : "All products"}
                      </a>
                    </li>
                  </ul>
                );
              })()}
            </div>
          </div>
        </div>

        {/* контакты — снизу, в том же оформлении, что и в шапке */}
        <div className="pt-10 text-[length:var(--header-ui-fs)] leading-[var(--header-ui-leading)]">
          <div className="flex flex-col gap-2">
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
  </aside>
) : null}
      </header>

      <main
        id="main"
        role="main"
        tabIndex={-1}
        aria-hidden={isMenuModal ? true : undefined}
        {...inertProps(isMenuModal)}
        className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      >
        {children}
      </main>

      <div aria-hidden={isMenuModal ? true : undefined} {...inertProps(isMenuModal)}>
        <SiteFooter
          navigation={navigation}
          navigationLabel={navigationLabels.footerLabel}
          currentPath={currentPath}
          copyrightText={copyrightText}
        />
      </div>
    </div>
  );
}
