import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./src/lib/i18n";

const LOCALE_PREFIXES = new Set(SUPPORTED_LOCALES);

function hasLocale(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length > 0 && LOCALE_PREFIXES.has(segments[0] as (typeof SUPPORTED_LOCALES)[number]);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (hasLocale(pathname)) {
    return NextResponse.next();
  }

  const locale = DEFAULT_LOCALE;
  const url = request.nextUrl.clone();
  const suffix = pathname === "/" ? "" : pathname;
  url.pathname = `/${locale}${suffix}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|keystatic|.*\\..*).*)"],
};