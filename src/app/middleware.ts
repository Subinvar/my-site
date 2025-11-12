import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';

const localePattern = new RegExp(`^/(?:${locales.join('|')})(?:/|$)`);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(/^\/(\w{2})(?:\/|$)/);

  const response = NextResponse.next();

  if (localePattern.test(pathname)) {
    const locale = (localeMatch?.[1] ?? defaultLocale) as Locale;
    response.cookies.set({
      name: 'locale',
      value: locale,
      path: '/',
      sameSite: 'lax',
    });
    return response;
  }

  response.cookies.set({
    name: 'locale',
    value: defaultLocale,
    path: '/',
    sameSite: 'lax',
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next|api|keystatic|assets).*)'],
};