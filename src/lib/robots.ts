import type { MetadataRoute } from 'next';

import { getSite } from '@/lib/keystatic';
import { defaultLocale } from '@/lib/i18n';
import { normalizeBaseUrl } from '@/lib/url';

export function buildSitemapUrl(baseUrl: string | null): string {
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized) {
    return '/sitemap.xml';
  }

  return `${normalized}/sitemap.xml`;
}

export async function getRobotsMetadata(): Promise<MetadataRoute.Robots> {
  const site = await getSite(defaultLocale);
  const sitemap = buildSitemapUrl(site.seo.canonicalBase ?? null);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/keystatic', '/api/keystatic'],
      },
    ],
    sitemap,
  } satisfies MetadataRoute.Robots;
}