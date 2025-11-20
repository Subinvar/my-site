import type { ReactNode } from 'react';
import { headers } from 'next/headers';

import './globals.css';
import { geistMono, geistSans } from './fonts';
import { HtmlLangSync } from './(site)/shared/html-lang-sync';
import { defaultLocale, locales, isLocale } from '@/lib/i18n';
import { LOCALE_HEADER } from '@/lib/locale-middleware';

export const dynamic = 'force-dynamic';

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const headersList = await headers();
  const requestLocale = headersList.get(LOCALE_HEADER);
  const cookieLocale = headersList
    .get('cookie')
    ?.split(';')
    .map((chunk) => chunk.trim())
    .map((chunk) => chunk.split('='))
    .find(([name]) => name === 'NEXT_LOCALE')?.[1];
  const locale = isLocale(requestLocale)
    ? requestLocale
    : isLocale(cookieLocale)
      ? cookieLocale
      : defaultLocale;
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-locales={locales.join(',')}
      data-default-locale={defaultLocale}
    >
      <body className="bg-white text-zinc-900 antialiased">
        <HtmlLangSync />
        {children}
      </body>
    </html>
  );
}