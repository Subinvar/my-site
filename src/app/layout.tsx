import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { defaultLocale, isLocale } from "@/lib/i18n";

import { geistMono, geistSans } from "./fonts";

const metadataBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
};

type RootLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale?: string }>;
};

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="alternate" type="application/atom+xml" href="/ru/feed.xml" title="Atom feed (ru-RU)" />
        <link rel="alternate" type="application/atom+xml" href="/en/feed.xml" title="Atom feed (en-US)" />
      </head>
      <body className="bg-white text-zinc-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}