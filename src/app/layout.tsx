import type { ReactNode } from 'react';
import { headers } from 'next/headers';

import './globals.css';
import { geistMono, geistSans } from './fonts';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

const LOCALE_HEADER = 'x-site-locale';

function resolveLocale(): Locale {
  const headerLocale = headers().get(LOCALE_HEADER);
  if (isLocale(headerLocale)) {
    return headerLocale;
  }
  return defaultLocale;
}

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const locale = resolveLocale();
  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-zinc-900 antialiased">{children}</body>
    </html>
  );
}