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

type HtmlLangSyncProps = {
  initialLocale?: Locale | null;
};

export function HtmlLangSync({ initialLocale }: HtmlLangSyncProps) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const currentPath = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : null);
    const cookieLocale = resolveLocaleFromCookie();
    const pathLocale = resolveLocaleFromPath(currentPath);
    const preferredLocale = pathLocale ?? initialLocale;
    const nextLocale = preferredLocale ?? cookieLocale ?? defaultLocale;

    if (preferredLocale && cookieLocale !== preferredLocale) {
      document.cookie = `NEXT_LOCALE=${encodeURIComponent(preferredLocale)}; Path=/; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}`;
    }

    document.documentElement.setAttribute('lang', nextLocale);
  }, [pathname, initialLocale]);

  return null;
}
