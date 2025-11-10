import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';

const localePattern = new RegExp(`^/(?:${locales.join('|')})(?:/|$)`);

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const localeMatch = pathname.match(/^\/(\w{2})(?:\/|$)/);

  if (pathname === '/' || pathname === '') {
    const target = new URL(`/${defaultLocale}${search}`, request.url);
    const response = NextResponse.redirect(target);
    response.cookies.set({
      name: 'locale',
      value: defaultLocale,
      path: '/',
      sameSite: 'lax',
    });
    return response;
  }

  if (localePattern.test(pathname)) {
    const response = NextResponse.next();
    const locale = (localeMatch?.[1] ?? defaultLocale) as Locale;
    response.cookies.set({
      name: 'locale',
      value: locale,
      path: '/',
      sameSite: 'lax',
    });
    return response;
  }

  const response = NextResponse.redirect(new URL(`/${defaultLocale}${pathname}${search}`, request.url));
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