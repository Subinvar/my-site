import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./src/lib/i18n";

const LOCALE_PREFIXES = new Set(SUPPORTED_LOCALES);

function extractLocale(pathname: string): (typeof SUPPORTED_LOCALES)[number] | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const [candidate] = segments;
  return LOCALE_PREFIXES.has(candidate as (typeof SUPPORTED_LOCALES)[number])
    ? (candidate as (typeof SUPPORTED_LOCALES)[number])
    : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const locale = extractLocale(pathname);

  if (locale === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    const segments = pathname.split("/").filter(Boolean).slice(1);
    const normalized = segments.length > 0 ? `/${segments.join("/")}` : "/";
    url.pathname = normalized;
    return NextResponse.redirect(url, { status: 308 });
  }

  if (locale) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/"
      ? `/${DEFAULT_LOCALE}`
      : `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|keystatic|.*\\..*).*)"],
};