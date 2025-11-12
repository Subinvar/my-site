import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, locales, type Locale } from "./src/lib/i18n";

const LOCALE_PREFIXES = new Set(locales);
const DEFAULT_LOCALE_INTERNAL_PREFIX = "/_default";

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

function removeDefaultLocalePrefix(pathname: string): string {
  if (!pathname.startsWith(`/${defaultLocale}`)) {
    return pathname;
  }

  const stripped = pathname.slice(defaultLocale.length + 1) || "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

function shouldBypass(pathname: string): boolean {
  if (pathname === DEFAULT_LOCALE_INTERNAL_PREFIX) {
    return true;
  }
  return pathname.startsWith(`${DEFAULT_LOCALE_INTERNAL_PREFIX}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/keystatic" || pathname.startsWith("/keystatic/")) {
    return NextResponse.next();
  }

  if (pathname === "/api/keystatic" || pathname.startsWith("/api/keystatic/")) {
    return NextResponse.next();
  }

  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  const locale = extractLocale(pathname);

  if (locale === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = removeDefaultLocalePrefix(pathname);
    if (url.pathname === pathname) {
      return NextResponse.next();
    }
    return NextResponse.redirect(url, { status: 308 });
  }

  if (hasFileExtension(pathname)) {
    return NextResponse.next();
  }

  if (locale) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `${DEFAULT_LOCALE_INTERNAL_PREFIX}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next|api|keystatic|.*\\.[^/]+$).*)",
    "/((?=.+\\.(?:xml|webmanifest)$).*)",
  ],
};