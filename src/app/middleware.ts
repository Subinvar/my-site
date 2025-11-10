import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { defaultLocale, locales } from '@/lib/i18n';

const localePattern = new RegExp(`^/(?:${locales.join('|')})(?:/|$)`);

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === '/' || pathname === '') {
    const target = new URL(`/${defaultLocale}${search}`, request.url);
    return NextResponse.redirect(target);
  }

  if (localePattern.test(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}${search}`, request.url));
}

export const config = {
  matcher: ['/((?!_next|api|keystatic|assets).*)'],
};