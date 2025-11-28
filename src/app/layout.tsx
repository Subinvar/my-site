import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';

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

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-locales={locales.join(',')}
      data-default-locale={defaultLocale}
      data-theme={theme}
    >
      <body className="antialiased">
        <HtmlLangSync />
        {children}
      </body>
    </html>
  );
}