import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import './globals.css';
import { defaultLocale, isLocale } from '@/lib/i18n';
import { geistMono, geistSans } from './fonts';

type RootLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale?: string }>;
};

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const resolved = await params;
  const locale = isLocale(resolved?.locale) ? resolved.locale : defaultLocale;
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  const normalizedLocale = isLocale(cookieLocale) ? cookieLocale : locale;

  return (
    <html lang={normalizedLocale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-zinc-900 antialiased">{children}</body>
    </html>
  );
}