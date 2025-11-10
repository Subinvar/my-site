import type { MetadataRoute } from 'next';
import { getSite } from '@/lib/keystatic';
import { defaultLocale } from '@/lib/i18n';

function resolveOrigin(domain?: string | null): URL {
  if (domain) {
    try {
      return new URL(domain.startsWith('http') ? domain : `https://${domain}`);
    } catch {
      // fall through
    }
  }
  const fallback = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return new URL(fallback);
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite(defaultLocale);
  const origin = resolveOrigin(site.domain);
  const shouldIndex = site.robots.index;

  return {
    rules: shouldIndex
      ? { userAgent: '*', allow: '/', disallow: [] }
      : { userAgent: '*', disallow: '/' },
    sitemap: [`${origin.origin}/sitemap.xml`],
    host: origin.host,
  } satisfies MetadataRoute.Robots;
}