'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
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

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [isMenuOpen]);

  // Геометрия линий относительно центра контейнера
  const topLineTransform = `translate(-50%, -50%) translateY(${
    areLinesConverged ? 0 : -4
  }px) rotate(${isBurgerRotated ? 45 : 0}deg)`;

  const bottomLineTransform = `translate(-50%, -50%) translateY(${
    areLinesConverged ? 0 : 4
  }px) rotate(${isBurgerRotated ? -45 : 0}deg)`;

  const openMenuLabel = locale === 'ru' ? 'Открыть меню' : 'Open menu';
  const closeMenuLabel = locale === 'ru' ? 'Закрыть меню' : 'Close menu';

  return (
    <div className={`${brandFont.variable} theme-transition flex min-h-screen flex-col bg-background text-foreground`}>
      <HtmlLangSync initialLocale={locale} />
      <SkipToContentLink label={skipLinkLabel} />

      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur shadow-[0_1px_0_rgba(148,27,32,0.12)]">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-0 sm:px-6 sm:py-0.5">
          {/* Левый край: логотип */}
          <div className="flex items-center">
            <a
              href={buildPath(locale)}
              className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Image
                src="/uploads/logo.svg"
                alt={brandName || 'Интема Групп'}
                width={64}
                height={64}
                className="h-8 w-auto sm:h-10"
              />
            </a>
          </div>

          {/* Правый край: две строки на десктопе + компактный блок на мобилке */}
          <div className="flex flex-1 items-center justify-end gap-4">
            {/* DESKTOP (>= lg): две строки справа */}
            <div className="hidden flex-col items-end gap-0.5 lg:flex">
              {/* СТРОКА 1: телефон, почта, переключатели */}
              <div className="flex items-center gap-1 text-[13px] leading-tight">
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

              {/* СТРОКА 2: разделы сайта */}
              <nav aria-label={navigationLabels.headerLabel}>
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
            <div className="flex items-center gap-2 lg:hidden">
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

        {/* Мобильное выезжающее меню справа */}
        <nav
          className={cn(
            'fixed inset-y-0 right-0 z-40 w-72 bg-[var(--background)] shadow-lg border-l border-[var(--border)] lg:hidden',
            'transform-gpu transition-transform duration-200 ease-out',
            isMenuOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex h-full flex-col gap-6 p-6">
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
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
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
