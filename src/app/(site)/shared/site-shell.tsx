import type { ReactNode } from 'react';
import localFont from 'next/font/local';

import { NavigationList } from '@/app/[locale]/navigation-list';
import type { Navigation, SiteContent } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';
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

const SKIP_LINK_COPY: Record<Locale, string> = {
  ru: 'Пропустить к основному контенту',
  en: 'Skip to main content',
};

type SiteShellProps = {
  locale: Locale;
  targetLocale: Locale;
  site: SiteContent;
  navigation: Navigation;
  switcherHref: string | null;
  children: ReactNode;
};

function SkipToContentLink({ locale }: { locale: Locale }) {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:not-sr-only focus-visible:rounded focus-visible:bg-blue-600 focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      {SKIP_LINK_COPY[locale]}
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
  return (
    <div className={`${brandFont.variable} flex min-h-screen flex-col bg-white text-zinc-900`}>
      <SkipToContentLink locale={locale} />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">{site.name ?? 'Intema Group'}</p>
            <p className="text-lg font-semibold text-zinc-900">{site.tagline}</p>
          </div>
          <div className="flex items-center gap-6">
            <NavigationList links={navigation.header} locale={locale} />
            <LanguageSwitcher
              currentLocale={locale}
              targetLocale={targetLocale}
              href={switcherHref}
            />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-zinc-600">
          <NavigationList links={navigation.footer} locale={locale} />
          <div className="flex flex-wrap items-center gap-4">
            {site.contacts.email ? (
              <a
                className="hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                href={`mailto:${site.contacts.email}`}
              >
                {site.contacts.email}
              </a>
            ) : null}
            {site.contacts.phone ? (
              <a
                className="hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                href={`tel:${site.contacts.phone}`}
              >
                {site.contacts.phone}
              </a>
            ) : null}
            {site.contacts.address ? <span>{site.contacts.address}</span> : null}
          </div>
        </div>
      </footer>
    </div>
  );
}