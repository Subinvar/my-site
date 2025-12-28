import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { cookies, headers } from 'next/headers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

import './globals.css';
import { bodyFont, headingFont } from './fonts';
import { HtmlLangSync } from './(site)/shared/html-lang-sync';
import { defaultLocale, locales, isLocale } from '@/lib/i18n';
import { LOCALE_HEADER } from '@/lib/locale-middleware';

export const dynamic = 'force-dynamic';

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const headersList = await headers();
  const cookieStore = await cookies();

  const requestLocale = headersList.get(LOCALE_HEADER);
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = isLocale(requestLocale)
    ? requestLocale
    : isLocale(cookieLocale)
      ? cookieLocale
      : defaultLocale;

  const themeCookie = cookieStore.get('theme')?.value;
  const theme = themeCookie === 'dark' || themeCookie === 'light' ? themeCookie : undefined;

  const setInitialTheme = `(() => {
    const preset = document.documentElement.dataset.theme;
    if (preset === 'light' || preset === 'dark') return;

    const match = document.cookie.match(/(?:^|;\\s*)theme=(light|dark)/);
    const stored = match?.[1];
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const theme = stored ?? (systemDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;

    if (!stored) {
      document.cookie = \`theme=\${theme}; path=/; max-age=31536000\`;
    }
  })();`;

  return (
    <html
      suppressHydrationWarning
      lang={locale}
      className={`${bodyFont.variable} ${headingFont.variable}`}
      data-locales={locales.join(',')}
      data-default-locale={defaultLocale}
      data-theme={theme}
    >
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
        <HtmlLangSync />
        {children}
      </body>
    </html>
  );
}