/* eslint-disable @next/next/no-sync-scripts -- Нам нужен синхронный скрипт до гидратации, чтобы язык <html> совпадал с URL сразу после перезагрузки */
import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';

import './globals.css';
import { geistMono, geistSans } from './fonts';
import { HtmlLangSync } from './(site)/shared/html-lang-sync';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const LOCALE_HEADER = 'x-middleware-request-locale';

export const dynamic = 'force-dynamic';

async function resolveLocale(): Promise<Locale> {
  const headerStore = await headers();
  const headerLocale = headerStore.get(LOCALE_HEADER);
  if (isLocale(headerLocale)) {
    return headerLocale;
  }
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }
  return defaultLocale;
}

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await resolveLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-locales={locales.join(',')}
      data-default-locale={defaultLocale}
    >
      <body className="bg-white text-zinc-900 antialiased">
        <script src="/html-lang-bootstrap.js" />
        <HtmlLangSync />
        {children}
      </body>
    </html>
  );
}