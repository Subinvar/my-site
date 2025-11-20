/* eslint-disable @next/next/no-sync-scripts -- Нам нужен синхронный скрипт до гидратации, чтобы язык <html> совпадал с URL сразу после перезагрузки */
import type { ReactNode } from 'react';

import './globals.css';
import { geistMono, geistSans } from './fonts';
import { HtmlLangSync } from './(site)/shared/html-lang-sync';
import { defaultLocale, locales } from '@/lib/i18n';

export const dynamic = 'force-static';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const locale = defaultLocale;
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