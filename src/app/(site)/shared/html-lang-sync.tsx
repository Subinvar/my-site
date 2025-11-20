'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

function resolveLocaleFromPath(pathname: string | null): Locale | null {
  if (!pathname) {
    return null;
  }
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return defaultLocale;
  }
  const [candidate] = segments;
  return isLocale(candidate) ? candidate : null;
}

function resolveLocaleFromCookie(): Locale | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const cookieMatch = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
  if (!cookieMatch) {
    return null;
  }
  try {
    const decoded = decodeURIComponent(cookieMatch[1] ?? '');
    return isLocale(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export function HtmlLangSync() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const cookieLocale = resolveLocaleFromCookie();
    const pathLocale = resolveLocaleFromPath(pathname);
    const nextLocale = pathLocale ?? cookieLocale ?? defaultLocale;

    if (pathLocale && cookieLocale !== pathLocale) {
      document.cookie = `NEXT_LOCALE=${encodeURIComponent(pathLocale)}; path=/; sameSite=lax`;
    }

    document.documentElement.setAttribute('lang', nextLocale);
  }, [pathname]);

  return null;
}
