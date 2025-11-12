import type { ReactNode } from 'react';
import './globals.css';
import { geistMono, geistSans } from './fonts';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-zinc-900 antialiased">{children}</body>
    </html>
  );
}