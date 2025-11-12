import type { MetadataRoute } from 'next';

import { getSite } from '@/lib/keystatic';
import { defaultLocale } from '@/lib/i18n';

export function buildSitemapUrl(baseUrl: string | null): string {
  if (!baseUrl) {
    return '/sitemap.xml';
  }

  const normalized = baseUrl.replace(/\/+$/, '');
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