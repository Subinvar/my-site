"use client";

import { useState, type ReactNode } from 'react';
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
  const openMenuLabel = locale === 'ru' ? 'Открыть меню' : 'Open menu';
  const closeMenuLabel = locale === 'ru' ? 'Закрыть меню' : 'Close menu';

  return (
    <div className={`${brandFont.variable} theme-transition flex min-h-screen flex-col bg-background text-foreground`}>
      <HtmlLangSync initialLocale={locale} />
      <SkipToContentLink label={skipLinkLabel} />
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur shadow-[0_1px_0_rgba(148,27,32,0.12)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-transparent lg:hidden transition-colors duration-150 hover:border-[var(--border)]"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? closeMenuLabel : openMenuLabel}
              aria-expanded={isMenuOpen}
            >
              <span className="relative block h-4 w-5">
                <span
                  className={cn(
                    'absolute inset-x-0 top-0 h-[2px] rounded-full bg-current transition-transform duration-200',
                    isMenuOpen ? 'translate-y-2 rotate-45' : ''
                  )}
                />
                <span
                  className={cn(
                    'absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-current transition-opacity duration-200',
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  )}
                />
                <span
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-current transition-transform duration-200',
                    isMenuOpen ? '-translate-y-2 -rotate-45' : ''
                  )}
                />
              </span>
            </button>

            <a
              href={buildPath(locale)}
              className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Image
                src="/uploads/logo.svg"
                alt={brandName || 'Интема Групп'}
                width={56}
                height={56}
                className="h-12 w-auto"
              />
            </a>
          </div>

          <nav
            className={cn(
              'fixed inset-y-0 right-0 z-40 w-72 bg-[var(--background)] shadow-lg border-l border-[var(--border)]',
              'transform-gpu transition-transform duration-200 ease-out',
              'lg:static lg:w-auto lg:transform-none lg:shadow-none lg:border-none',
              isMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
            )}
          >
            <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:p-0">
              <NavigationList
                links={navigation.header}
                ariaLabel={navigationLabels.headerLabel}
                currentPath={currentPath}
                className="lg:flex"
              />

              <div className="flex items-center gap-3 lg:hidden">
                <ThemeToggle />
                <LanguageSwitcher
                  currentLocale={locale}
                  targetLocale={targetLocale}
                  href={switcherHref}
                  switchToLabels={switchToLabels}
                />
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-2">
            {site.contacts.phone ? (
              <a
                href={`tel:${site.contacts.phone.replace(/[^+\d]/g, '')}`}
                className="hidden text-sm font-medium text-foreground md:inline-flex"
              >
                {site.contacts.phone}
              </a>
            ) : null}

            {site.contacts.email ? (
              <a
                href={`mailto:${site.contacts.email}`}
                className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex"
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
        </div>
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
                  <a href={`tel:${site.contacts.phone.replace(/[^+\d]/g, '')}`}>
                    {site.contacts.phone}
                  </a>
                ) : null}
                {site.contacts.email ? <a href={`mailto:${site.contacts.email}`}>{site.contacts.email}</a> : null}
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