'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
import { HeaderBrandFlipText } from '@/app/(site)/shared/ui/header-brand-flip-text';

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
      ? {
          id: 'phone',
          label: site.contacts.phone,
          href: `tel:${site.contacts.phone}`,
        }
      : null,
    site.contacts.email
      ? {
          id: 'email',
          label: site.contacts.email,
          href: `mailto:${site.contacts.email}`,
        }
      : null,
    telegramUrl
      ? {
          id: 'telegram',
          label: telegramLabel || telegramUrl,
          href: telegramUrl,
        }
      : null,
  ].filter((item): item is { id: string; label: string; href: string } => Boolean(item));

  const hasContacts = contactLinks.length > 0 || Boolean(site.contacts.address);

  const currentYear = new Date().getFullYear();
  const copyrightTemplate = site.footer?.copyright?.trim() ?? '';
  const copyrightText = copyrightTemplate.length
    ? copyrightTemplate.replaceAll('{year}', String(currentYear)).replaceAll('{siteName}', brandName)
    : '';
  const hasCopyright = copyrightText.length > 0;

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Состояния для иконки бургера
  const [areLinesConverged, setAreLinesConverged] = useState(false);
  const [isBurgerRotated, setIsBurgerRotated] = useState(false);

  // Запоминаем предыдущее значение флага меню
  const prevIsMenuOpenRef = useRef(isMenuOpen);

  useEffect(() => {
    const prevIsMenuOpen = prevIsMenuOpenRef.current;
    prevIsMenuOpenRef.current = isMenuOpen;

    // Если значение не изменилось (в том числе на самом первом вызове эффекта) —
    // ничего не анимируем.
    if (prevIsMenuOpen === isMenuOpen) {
      return;
    }

    let timer: number | undefined;
    const frameId = window.requestAnimationFrame(() => {
      if (isMenuOpen) {
        // ОТКРЫТИЕ: две параллельные линии → одна → крест
        setAreLinesConverged(true);
        setIsBurgerRotated(false);

        timer = window.setTimeout(() => {
          setIsBurgerRotated(true);
        }, 120);
      } else {
        // ЗАКРЫТИЕ: крест → одна линия → две параллельные
        setIsBurgerRotated(false);
        setAreLinesConverged(true);

        timer = window.setTimeout(() => {
          setAreLinesConverged(false);
        }, 120);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [isMenuOpen]);

  // Высота шапки нужна и для отступа контента, и для точки начала мобильного меню
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(56); // дефолт под мобильную шапку

  useEffect(() => {
    const updateHeight = () => {
      if (!headerRef.current) return;
      const nextHeight = Math.round(headerRef.current.getBoundingClientRect().height);

      setHeaderHeight((prev) => {
        if (Math.abs(prev - nextHeight) < 1) {
          return prev;
        }
        return nextHeight;
      });
    };

    const observer = new ResizeObserver(updateHeight);
    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);
  // Геометрия линий относительно центра контейнера
  const topLineTransform = `translate(-50%, -50%) translateY(${
    areLinesConverged ? 0 : -4
  }px) rotate(${isBurgerRotated ? 45 : 0}deg)`;

  const bottomLineTransform = `translate(-50%, -50%) translateY(${
    areLinesConverged ? 0 : 4
  }px) rotate(${isBurgerRotated ? -45 : 0}deg)`;

  const openMenuLabel = locale === 'ru' ? 'Открыть меню' : 'Open menu';
  const closeMenuLabel = locale === 'ru' ? 'Закрыть меню' : 'Close menu';

  const logoHeight = Math.max(40, Math.min(96, headerHeight - 10));

  return (
    <div
      className={`${brandFont.variable} theme-transition flex min-h-screen flex-col bg-background text-foreground`}
      style={{ paddingTop: headerHeight }}
    >
      <HtmlLangSync initialLocale={locale} />
      <SkipToContentLink label={skipLinkLabel} />

      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 bg-background/90 backdrop-blur before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:block before:h-px before:translate-y-[1px] before:bg-[rgba(148,27,32,0.12)] before:content-['']"
        style={{ '--header-height': `${headerHeight}px` } as CSSProperties }
      >
        <div className="relative">
          <div
            className={cn(
              'flex w-full items-center justify-between gap-4 px-4 py-[clamp(0.45rem,0.3rem+0.4vw,1rem)] sm:px-6',
              'lg:grid lg:grid-cols-[auto,1fr] lg:grid-rows-2 lg:items-stretch lg:justify-between lg:gap-6',
            )}
          >
            {/* Левый край: логотип */}
            <div className="flex items-center lg:row-span-2 lg:h-full lg:w-full lg:items-center lg:justify-start lg:rounded-lg lg:outline lg:outline-1 lg:outline-dashed lg:outline-black/30">
              <a
                href={buildPath(locale)}
                className="flex items-center gap-2 text-left no-underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Image
                  src="/uploads/logo.svg"
                  alt={brandLabel}
                  width={64}
                  height={64}
                  className="w-auto object-contain"
                  style={{ height: `${logoHeight}px`, maxHeight: `${logoHeight}px` }}
                />
                <HeaderBrandFlipText
                  text={brandLabel}
                  className="font-bold text-brand-600 dark:text-brand-600 text-[clamp(1.05rem,0.9rem+0.6vw,1.6rem)] leading-tight"
                />
              </a>
            </div>

            {/* Правый край: две строки на десктопе + компактный блок на мобилке */}
            <div className="flex flex-1 items-center justify-end gap-4 lg:col-start-2 lg:row-span-2 lg:grid lg:grid-rows-2 lg:items-stretch lg:gap-2">
              {/* DESKTOP (>= lg): два равных блока справа */}
              <div className="hidden w-full grid-rows-2 gap-2 lg:grid">
                {/* БЛОК 2: телефон, почта, переключатели */}
                <div className="flex w-full items-center justify-end gap-1 rounded-lg text-[clamp(0.8rem,0.75rem+0.2vw,0.95rem)] leading-tight lg:h-full lg:outline lg:outline-1 lg:outline-dashed lg:outline-black/30">
                  {site.contacts.phone ? (
                    <a
                      href={`tel:${site.contacts.phone.replace(/[^+\d]/g, '')}`}
                      className="hidden font-medium text-muted-foreground hover:text-foreground no-underline md:inline-flex"
                    >
                      {site.contacts.phone}
                    </a>
                  ) : null}

                  {site.contacts.email ? (
                    <a
                      href={`mailto:${site.contacts.email}`}
                      className="hidden font-medium text-muted-foreground hover:text-foreground no-underline md:inline-flex"
                    >
                      {site.contacts.email}
                    </a>
                  ) : null}

                  <div className="hidden items-center gap-2 sm:flex">
                    <ThemeToggle />
                    <LanguageSwitcher
                      currentLocale={locale}
                      targetLocale={targetLocale}
                      href={switcherHref}
                      switchToLabels={switchToLabels}
                    />
                  </div>
                </div>

                {/* БЛОК 3: разделы сайта */}
                <nav
                  aria-label={navigationLabels.headerLabel}
                  className="flex w-full items-center justify-end rounded-lg lg:h-full lg:outline lg:outline-1 lg:outline-dashed lg:outline-black/30"
                >
                  <NavigationList
                    links={navigation.header}
                    ariaLabel={navigationLabels.headerLabel}
                    currentPath={currentPath}
                    className="flex"
                    density="compact"
                  />
                </nav>
              </div>

              {/* MOBILE (< lg): всё справа в одну линию + бургер */}
              <div className="flex items-center gap-1.5 lg:hidden">
                <ThemeToggle />
                <LanguageSwitcher
                  currentLocale={locale}
                  targetLocale={targetLocale}
                  href={switcherHref}
                  switchToLabels={switchToLabels}
                />
                <button
                  type="button"
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-background/70 text-muted-foreground',
                    'transition-colors duration-150 hover:border-[var(--border)] hover:bg-background/80 hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    'focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-[var(--background)]',
                  )}
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-label={isMenuOpen ? closeMenuLabel : openMenuLabel}
                  aria-expanded={isMenuOpen}
                >
                  <span className="relative block h-4 w-5">
                    {/* Верхняя линия */}
                    <span
                      className="pointer-events-none absolute left-1/2 top-1/2 block h-[2px] w-full rounded-full bg-current transition-transform duration-200 ease-in-out"
                      style={{ transform: topLineTransform }}
                    />
                    {/* Нижняя линия */}
                    <span
                      className="pointer-events-none absolute left-1/2 top-1/2 block h-[2px] w-full rounded-full bg-current transition-transform duration-200 ease-in-out"
                      style={{ transform: bottomLineTransform }}
                    />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Мобильное выезжающее меню справа */}
        <nav
          className={cn(
            'fixed inset-y-0 right-0 z-40 w-full max-w-xs bg-background/95 shadow-lg border-l border-border lg:hidden',
            'backdrop-blur-sm',
            // Более плавная анимация
            'transform-gpu transition-transform duration-300 ease-out',
            isMenuOpen ? 'translate-x-0' : 'translate-x-full',
          )}
          style={{ top: headerHeight, bottom: 0 }}
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
      </header>

      {isMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-md lg:hidden"
          aria-hidden="true"
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
            {hasContacts ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {site.contacts.phone ? (
                  <a href={`tel:${site.contacts.phone.replace(/[^+\d]/g, '')}`}>{site.contacts.phone}</a>
                ) : null}
                {site.contacts.email ? (
                  <a href={`mailto:${site.contacts.email}`}>{site.contacts.email}</a>
                ) : null}
                {site.contacts.address ? <span>{site.contacts.address}</span> : null}
              </div>
            ) : null}

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
