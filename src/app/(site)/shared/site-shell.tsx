import type { ReactNode } from 'react';
import localFont from 'next/font/local';

import { getInterfaceDictionary } from '@/content/dictionary';
import { NavigationList } from '@/app/[locale]/navigation-list';
import type { Navigation, SiteContent } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';
import { LanguageSwitcher } from './language-switcher';

const brandFont = localFont({
  src: [
    {
      path: '../../../../public/fonts/geist/Geist-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../../public/fonts/geist/Geist-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  preload: true,
  display: 'swap',
  variable: '--font-brand',
});

type SiteShellProps = {
  locale: Locale;
  targetLocale: Locale;
  site: SiteContent;
  navigation: Navigation;
  switcherHref: string | null;
  children: ReactNode;
};

function SkipToContentLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:not-sr-only focus-visible:rounded focus-visible:bg-blue-600 focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
  children,
}: SiteShellProps) {
  const brandName = site.name ?? 'Intema Group';
  const dictionary = getInterfaceDictionary(locale);
  const skipLinkLabel = dictionary.common.skipToContent;
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
  ].filter((item): item is { id: string; label: string; href: string } => Boolean(item));

  const hasContacts = contactLinks.length > 0 || Boolean(site.contacts.address);
  const currentYear = new Date().getFullYear();
  const copyrightTemplate = site.footer?.copyright ?? '© {year} Intema Group. All rights reserved.';
  const copyrightText = copyrightTemplate
    .replaceAll('{year}', String(currentYear))
    .replaceAll('{siteName}', brandName);

  return (
    <div className={`${brandFont.variable} flex min-h-screen flex-col bg-white text-zinc-900`}>
      <SkipToContentLink label={skipLinkLabel} />
      <header className="border-b border-zinc-200 bg-white">
        {hasContacts ? (
          <div className="border-b border-zinc-200 bg-zinc-900 text-sm text-zinc-100">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-4 px-6 py-2">
              {contactLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="inline-flex items-center gap-2 text-zinc-100 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  {link.label}
                </a>
              ))}
              {site.contacts.address ? (
                <span className="text-zinc-300">{site.contacts.address}</span>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <a
              href={buildPath(locale)}
              className="max-w-xl space-y-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {brandName}
              </span>
              {site.tagline ? (
                <span className="block text-2xl font-semibold text-zinc-900">{site.tagline}</span>
              ) : null}
            </a>
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <NavigationList links={navigation.header} locale={locale} />
              <LanguageSwitcher
                currentLocale={locale}
                targetLocale={targetLocale}
                href={switcherHref}
              />
            </div>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 text-sm text-zinc-600">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {brandName}
              </p>
              {site.tagline ? (
                <p className="max-w-xl text-base text-zinc-700">{site.tagline}</p>
              ) : null}
            </div>
            {hasContacts ? (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {contactLinks.map((link) => (
                  <a
                    key={`footer-${link.id}`}
                    className="text-zinc-600 transition hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    href={link.href}
                  >
                    {link.label}
                  </a>
                ))}
                {site.contacts.address ? <span>{site.contacts.address}</span> : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <NavigationList links={navigation.footer} locale={locale} />
            <p className="text-xs text-zinc-500">{copyrightText}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}