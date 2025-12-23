'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';

import { getInterfaceDictionary } from '@/content/dictionary';
import { NavigationList } from '@/app/[locale]/navigation-list';
import { formatTelegramHandle } from '@/lib/contacts';
import type { Navigation, SiteContent } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';
import { cn } from '@/lib/cn';
import { LanguageSwitcher } from './language-switcher';
import { HtmlLangSync } from './html-lang-sync';
import { ThemeToggle } from './theme-toggle';

const HEADER_NAV_STABLE_SLOTS: Record<string, number> = {
  products: 96,
  news: 80,
  about: 104,
  partners: 96,
  contacts: 96,
};

const brandFont = { variable: 'font-brand-var' };

type SiteShellProps = {
  locale: Locale;
  targetLocale: Locale;
  site: SiteContent;
  navigation: Navigation;
  switcherHref: string | null;
  currentPath: string;
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

export function SiteShell({
  locale,
  targetLocale,
  site,
  navigation,
  switcherHref,
  currentPath,
  children,
}: SiteShellProps) {
  const brandName = site.name?.trim() ?? '';
  const dictionary = getInterfaceDictionary(locale);
  const skipLinkLabel = dictionary.common.skipToContent;
  const navigationLabels = dictionary.navigation;
  const switchToLabels = dictionary.languageSwitcher.switchTo;

  const telegramUrl = site.contacts.telegramUrl?.trim() ?? '';
  const telegramLabel = formatTelegramHandle(telegramUrl) ?? (telegramUrl ? 'Telegram' : '');
  const brandLabel = brandName || 'Интема Групп';

  const contactLinks = [
    site.contacts.phone
      ? { id: 'phone', label: site.contacts.phone, href: `tel:${site.contacts.phone}` }
      : null,
    site.contacts.email
      ? { id: 'email', label: site.contacts.email, href: `mailto:${site.contacts.email}` }
      : null,
    telegramUrl ? { id: 'telegram', label: telegramLabel || telegramUrl, href: telegramUrl } : null,
  ].filter((item): item is { id: string; label: string; href: string } => Boolean(item));

  const hasContacts = contactLinks.length > 0 || Boolean(site.contacts.address);

  const currentYear = new Date().getFullYear();
  const copyrightTemplate = site.footer?.copyright?.trim() ?? '';
  const copyrightText = copyrightTemplate.length
    ? copyrightTemplate.replaceAll('{year}', String(currentYear)).replaceAll('{siteName}', brandName)
    : '';
  const hasCopyright = copyrightText.length > 0;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // ====== Шаг 3: “меню уезжает вверх → снизу приезжает бургер” ======
  const [isCompactNav, setIsCompactNav] = useState(false);
  const [isLgUp, setIsLgUp] = useState(false);
  const navHostRef = useRef<HTMLDivElement | null>(null);
  const navMeasureRef = useRef<HTMLDivElement | null>(null);

  // “бургер-режим”: на мобилке всегда бургер, на десктопе — если меню не влезает
  const isBurgerMode = !isLgUp || isCompactNav;

  // inert: чтобы скрытый слой не табался/не фокусился (React/TS могут не знать inert)
  const inertProps = (enabled: boolean) => (enabled ? ({ inert: true } as any) : {});

  const [isHeaderElevated, setIsHeaderElevated] = useState(false);
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

  // Состояния для иконки бургера
  const [areLinesConverged, setAreLinesConverged] = useState(false);
  const [isBurgerRotated, setIsBurgerRotated] = useState(false);
  const prevIsMenuOpenRef = useRef(isMenuOpen);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(query.matches);

    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsLgUp(mql.matches);

    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- пошаговая анимация бургера */
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
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  // Высота шапки
  const shellRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const headerEl = headerRef.current;
    const shellEl = shellRef.current;
    if (!headerEl || !shellEl || typeof ResizeObserver === 'undefined') return;

    const update = () => {
      const h = Math.round(headerEl.getBoundingClientRect().height);
      shellEl.style.setProperty('--header-height', `${h}px`);
    };

    const observer = new ResizeObserver(update);
    observer.observe(headerEl);
    update();

    return () => observer.disconnect();
  }, []);

  // Измеряем: “влезает ли меню” (ТОЛЬКО для lg+)
  useLayoutEffect(() => {
    if (!isLgUp) {
      setIsCompactNav(false);
      return;
    }

    const host = navHostRef.current;
    const measure = navMeasureRef.current;
    if (!host || !measure || typeof ResizeObserver === 'undefined') return;

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

  // Если вышли из burger-mode — закрываем панель
  useEffect(() => {
    if (!isBurgerMode && isMenuOpen) setIsMenuOpen(false);
  }, [isBurgerMode, isMenuOpen]);

  // Подъём/тень шапки при скролле
  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = !entry.isIntersecting;
        setIsHeaderElevated((prev) => (prev === next ? prev : next));
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const topLineTransform = `translate(-50%, -50%) translateY(${areLinesConverged ? 0 : -4}px) rotate(${isBurgerRotated ? 45 : 0}deg)`;
  const bottomLineTransform = `translate(-50%, -50%) translateY(${areLinesConverged ? 0 : 4}px) rotate(${isBurgerRotated ? -45 : 0}deg)`;

  const openMenuLabel = locale === 'ru' ? 'Открыть меню' : 'Open menu';
  const closeMenuLabel = locale === 'ru' ? 'Закрыть меню' : 'Close menu';

  return (
    <div
      ref={shellRef}
      className={cn(
        brandFont.variable,
        'theme-transition relative flex min-h-screen flex-col bg-background text-foreground',
        'transition-[padding-top] duration-200 ease-out motion-reduce:transition-none motion-reduce:duration-0',
      )}
      style={
        {
          '--header-height': 'var(--header-height-initial)',
          paddingTop: 'var(--header-height)',
        } as CSSProperties
      }
    >
      <HtmlLangSync initialLocale={locale} />
      <SkipToContentLink label={skipLinkLabel} />

      <div ref={scrollSentinelRef} className="absolute inset-x-0 top-0 h-1 w-px" aria-hidden />

      <header
        ref={headerRef}
        className={cn(
          'fixed inset-x-0 top-0 z-50 backdrop-blur before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:block before:h-px before:translate-y-[1px] before:bg-[var(--color-brand-600)] before:opacity-0 before:transition-opacity before:duration-200 before:ease-out before:content-[\'\']',
          'transition-[box-shadow,background-color,backdrop-filter] duration-200 ease-out',
          isHeaderElevated
            ? 'bg-background/95 shadow-[0_14px_38px_rgba(0,0,0,0.12)] backdrop-blur-md before:opacity-100'
            : 'bg-background/90 backdrop-blur',
        )}
      >
        <div className="relative">
          <div
            className={cn(
              'flex w-full items-center justify-between',
              'gap-[var(--header-gap-x)] px-[var(--header-pad-x)] py-[var(--header-pad-y)]',
              'lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-stretch lg:gap-x-6',
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
                    'font-[var(--font-heading)]',
                    'text-[length:var(--header-brand-fs)] font-bold leading-[1.05]',
                    'tracking-[-0.02em] text-brand-600 dark:text-brand-600',
                  )}
                >
                  {brandLabel}
                </span>
              </a>
            </div>

            {/* RIGHT: один и тот же блок всегда (без hidden/lg:hidden) */}
            <div
              className={cn(
                'w-full justify-items-end',
                'grid grid-rows-[auto_auto] gap-y-2',
                'lg:grid-rows-[minmax(44px,auto)_minmax(44px,auto)] lg:gap-y-0',
              )}
            >
              {/* Верхняя строка: контакты (md+) + тема/язык (всегда) */}
              <div className="flex h-full w-full items-center justify-end gap-5 rounded-lg text-[clamp(0.935rem,0.858rem+0.275vw,1.078rem)] font-medium leading-tight">
                {site.contacts.phone ? (
                  <a
                    href={`tel:${site.contacts.phone.replace(/[^+\d]/g, '')}`}
                    className="hidden text-muted-foreground no-underline hover:text-foreground md:inline-flex"
                  >
                    {site.contacts.phone}
                  </a>
                ) : null}

                {site.contacts.email ? (
                  <a
                    href={`mailto:${site.contacts.email}`}
                    className="hidden text-muted-foreground no-underline hover:text-foreground md:inline-flex"
                  >
                    {site.contacts.email}
                  </a>
                ) : null}

                <ThemeToggle />
                <LanguageSwitcher
                  currentLocale={locale}
                  targetLocale={targetLocale}
                  href={switcherHref}
                  switchToLabels={switchToLabels}
                />
              </div>

              {/* Нижняя строка: “вагончик” меню↔бургер */}
              <div
                ref={navHostRef}
                className={cn(
                  'relative w-full overflow-hidden rounded-lg',
                  'h-10', // на мобилке это ровно высота кнопки
                  'lg:h-full lg:min-h-[44px]',
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 h-[200%] w-full will-change-transform',
                    'transform-gpu transition-transform duration-300 ease-out',
                    'motion-reduce:transition-none motion-reduce:duration-0',
                    isBurgerMode ? '-translate-y-1/2' : 'translate-y-0',
                  )}
                >
                  {/* SLIDE 1: Меню */}
                  <div
                    aria-hidden={isBurgerMode}
                    {...inertProps(isBurgerMode)}
                    className={cn(
                      'flex h-1/2 w-full items-center justify-end',
                      'transition-[opacity,transform] duration-200 ease-out',
                      'motion-reduce:transition-none motion-reduce:duration-0',
                      isBurgerMode ? 'opacity-0 pointer-events-none -translate-y-1' : 'opacity-100 pointer-events-auto translate-y-0',
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
                    aria-hidden={!isBurgerMode}
                    {...inertProps(!isBurgerMode)}
                    className={cn(
                      'flex h-1/2 w-full items-center justify-end',
                      'transition-[opacity,transform] duration-200 ease-out delay-75',
                      'motion-reduce:transition-none motion-reduce:duration-0 motion-reduce:delay-0',
                      isBurgerMode ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-1',
                    )}
                  >
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-xl',
                        'border border-transparent bg-background/70 text-foreground',
                        'transition-colors duration-200 ease-out motion-reduce:transition-none motion-reduce:duration-0',
                        'hover:border-[var(--border)] hover:bg-background/80 hover:text-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        'focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-[var(--background)]',
                      )}
                      onClick={() => setIsMenuOpen((prev) => !prev)}
                      aria-label={isMenuOpen ? closeMenuLabel : openMenuLabel}
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

                {/* Линейка для измерения ширины меню (не влияет на layout) */}
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

        {/* Боковая панель меню — только в burger-mode */}
        {isBurgerMode ? (
          <nav
            className={cn(
              'fixed inset-y-0 right-0 z-40 w-full max-w-xs border-l border-border bg-background/95 shadow-lg',
              'backdrop-blur-sm',
              'transform-gpu transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0',
              isMenuOpen ? 'translate-x-0' : 'translate-x-full',
            )}
            style={{ top: 'var(--header-height)', bottom: 0 } as CSSProperties}
          >
            <div className="flex h-full flex-col gap-8 p-6">
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

      <main id="main" role="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-border bg-muted/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {hasContacts ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {site.contacts.phone ? (
                  <a href={`tel:${site.contacts.phone.replace(/[^+\d]/g, '')}`}>{site.contacts.phone}</a>
                ) : null}
                {site.contacts.email ? <a href={`mailto:${site.contacts.email}`}>{site.contacts.email}</a> : null}
                {site.contacts.address ? <span>{site.contacts.address}</span> : null}
              </div>
            ) : null}

            <NavigationList links={navigation.footer} ariaLabel={navigationLabels.footerLabel} currentPath={currentPath} />
          </div>

          {hasCopyright ? <p className="text-[11px] sm:text-xs">{copyrightText}</p> : null}
        </div>
      </footer>
    </div>
  );
}
