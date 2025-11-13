import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, locales, type Locale } from "./src/lib/i18n";

const LOCALE_COOKIE = "NEXT_LOCALE";
const LOCALE_HEADER = "x-site-locale";

const LOCALE_PREFIXES = new Set(locales);

function withLocaleCookie(response: NextResponse, locale: Locale): NextResponse {
  response.cookies.set({
    name: LOCALE_COOKIE,
    value: locale,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

function nextWithLocale(request: NextRequest, locale: Locale): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  return withLocaleCookie(response, locale);
}

function rewriteWithLocale(request: NextRequest, url: URL, locale: Locale): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  const response = NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
  return withLocaleCookie(response, locale);
}

function redirectWithLocale(url: URL, locale: Locale, status: number): NextResponse {
  const response = NextResponse.redirect(url, { status });
  return withLocaleCookie(response, locale);
}

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/keystatic" || pathname.startsWith("/keystatic/")) {
    return NextResponse.next();
  }

  if (pathname === "/api/keystatic" || pathname.startsWith("/api/keystatic/")) {
    return NextResponse.next();
  }

  const locale = extractLocale(pathname);
  const isFileRequest = hasFileExtension(pathname);

  if (isFileRequest) {
    if (locale === defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = removeDefaultLocalePrefix(pathname);
      if (url.pathname !== pathname) {
        return rewriteWithLocale(request, url, defaultLocale);
      }
    }
    return nextWithLocale(request, locale ?? defaultLocale);
  }

  if (locale === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = removeDefaultLocalePrefix(pathname);
    if (url.pathname === pathname) {
      return nextWithLocale(request, defaultLocale);
    }
    return redirectWithLocale(url, defaultLocale, 308);
  }

  if (locale) {
    return nextWithLocale(request, locale);
  }

  if (pathname === "/") {
    return nextWithLocale(request, defaultLocale);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`.replace(/\/+/, "/");
  return rewriteWithLocale(request, url, defaultLocale);
}

export const config = {
  matcher: [
    "/((?!_next|api|keystatic|.*\\.[^/]+$).*)",
    "/((?=.+\\.(?:xml|webmanifest)$).*)",
  ],
};