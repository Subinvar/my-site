import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, locales, type Locale } from "./src/lib/i18n";

const LOCALE_PREFIXES = new Set(locales);

function hasFileExtension(pathname: string): boolean {
  const trimmed = pathname.split("?")[0]?.replace(/\/$/, "") ?? "";
  if (!trimmed) {
    return false;
  }
  return /\.[^/]+$/.test(trimmed);
}

function extractLocale(pathname: string): Locale | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const [candidate] = segments;
  return LOCALE_PREFIXES.has(candidate as Locale)
    ? (candidate as Locale)
    : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/keystatic" || pathname.startsWith("/keystatic/")) {
    return NextResponse.next();
  }

  if (pathname === "/api/keystatic" || pathname.startsWith("/api/keystatic/")) {
    return NextResponse.next();
  }

  if (hasFileExtension(pathname)) {
    return NextResponse.next();
  }

  const locale = extractLocale(pathname);

  if (!locale) {
    const url = request.nextUrl.clone();
    const suffix = pathname === "/" ? "" : pathname;
    url.pathname = `/${defaultLocale}${suffix}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|keystatic|.*\\.[^/]+$).*)",
    "/((?=.+\\.(?:xml|webmanifest)$).*)",
  ],
};