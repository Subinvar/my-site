import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { locales, type Locale } from "./src/lib/i18n";

const LOCALE_PREFIXES = new Set(locales);
const LOCALE_AWARE_EXTENSIONS = new Set([".xml", ".webmanifest"]);

function getExtension(pathname: string): string | null {
  const lastSegment = pathname.split("/").pop() ?? "";
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex === -1) {
    return null;
  }
  return lastSegment.slice(dotIndex);
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

  const extension = getExtension(pathname);
  if (extension && !LOCALE_AWARE_EXTENSIONS.has(extension)) {
    return NextResponse.next();
  }

  const locale = extractLocale(pathname);

  if (!locale) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|keystatic|.*\\.[^/]+$).*)",
    "/((?=.+\\.(?:xml|webmanifest)$).*)",
  ],
};