const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function getSiteUrl(): string {
  return SITE_URL;
}

export function buildAbsoluteUrl(pathname: string): string {
  const normalized = pathname.startsWith('http') ? pathname : pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(normalized, SITE_URL).toString();
}