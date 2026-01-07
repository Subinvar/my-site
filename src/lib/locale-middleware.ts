import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, locales, type Locale } from "./i18n";
import productsPageSettings from "../../content/products-page/index.json";

const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_HEADER = "x-middleware-request-locale";

const LOCALE_PREFIXES = new Set(locales);

type ProductsPageSettingsJson = {
  slug?: Partial<Record<Locale, string>>;
};

const INTERNAL_PRODUCTS_SEGMENTS = ['products'];

const normalizeSlugSegments = (value: string): string[] =>
  value
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

const productsPageSlugByLocale = (productsPageSettings as ProductsPageSettingsJson)?.slug ?? {};

const productsExternalSegments: Record<Locale, string[]> = locales.reduce((acc, locale) => {
  const raw = productsPageSlugByLocale[locale] ?? productsPageSlugByLocale[defaultLocale] ?? 'products';
  acc[locale] = normalizeSlugSegments(raw || 'products');
  return acc;
}, {} as Record<Locale, string[]>);

function startsWithSegments(segments: string[], prefix: string[]): boolean {
  if (prefix.length === 0) {
    return false;
  }
  if (segments.length < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i += 1) {
    if (segments[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}

function withLocaleCookie(response: NextResponse, locale: Locale): NextResponse {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: LOCALE_COOKIE,
    value: locale,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: isProduction,
  });
  return response;
}

function prepareRequestHeaders(request: NextRequest, locale: Locale): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  const existingCookies = requestHeaders.get('cookie');
  const cookieMap = new Map<string, string>();
  if (existingCookies) {
    for (const chunk of existingCookies.split(';')) {
      const [rawName, ...rest] = chunk.split('=');
      if (!rawName) continue;
      const name = rawName.trim();
      if (!name) continue;
      cookieMap.set(name, rest.join('=').trim());
    }
  }
  cookieMap.set(LOCALE_COOKIE, locale);
  const cookieHeader = Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  requestHeaders.set('cookie', cookieHeader);
  return requestHeaders;
}

function nextWithLocale(request: NextRequest, locale: Locale): NextResponse {
  const requestHeaders = prepareRequestHeaders(request, locale);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  return withLocaleCookie(response, locale);
}

function rewriteWithLocale(request: NextRequest, url: URL, locale: Locale): NextResponse {
  const requestHeaders = prepareRequestHeaders(request, locale);
  const response = NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/keystatic" || pathname.startsWith("/keystatic/")) {
    return NextResponse.next();
  }

  if (pathname === "/api/keystatic" || pathname.startsWith("/api/keystatic/")) {
    return NextResponse.next();
  }

  if (pathname === "/_next" || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const locale = extractLocale(pathname);
  const isFileRequest = hasFileExtension(pathname);

  if (!isFileRequest) {
    const allSegments = pathname.split("/").filter(Boolean);
    const pathSegments = locale ? allSegments.slice(1) : allSegments;
    const effectiveLocale = locale ?? defaultLocale;
    const externalSegments = productsExternalSegments[effectiveLocale] ?? INTERNAL_PRODUCTS_SEGMENTS;

    if (startsWithSegments(pathSegments, externalSegments)) {
      const rest = pathSegments.slice(externalSegments.length);
      const internalSegments = locale
        ? [effectiveLocale, ...INTERNAL_PRODUCTS_SEGMENTS, ...rest]
        : [defaultLocale, ...INTERNAL_PRODUCTS_SEGMENTS, ...rest];
      const internalPath = `/${internalSegments.join("/")}`.replace(/\/+/, "/");

      if (internalPath !== pathname) {
        const url = request.nextUrl.clone();
        url.pathname = internalPath;
        return rewriteWithLocale(request, url, effectiveLocale);
      }
    }
  }

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
    return nextWithLocale(request, defaultLocale);
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
