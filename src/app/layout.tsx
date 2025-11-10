import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

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
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-zinc-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}