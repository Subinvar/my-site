import type { ReactNode } from 'react';
import './globals.css';
import { geistMono, geistSans } from './fonts';
import { defaultLocale } from '@/lib/i18n';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={defaultLocale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-zinc-900 antialiased">{children}</body>
    </html>
  );
}