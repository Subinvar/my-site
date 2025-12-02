import type { MetadataRoute } from 'next';

import { getSite } from '@/lib/keystatic';
import { defaultLocale } from '@/lib/i18n';
import { normalizeBaseUrl } from '@/lib/url';

export function buildSitemapUrl(baseUrl: string | null): string {
  const normalized = normalizeBaseUrl(baseUrl) ?? normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);

  if (!normalized) {
    return '/sitemap.xml';
  }

  return `${normalized}/sitemap.xml`;
}

export async function getRobotsMetadata(): Promise<MetadataRoute.Robots> {
  const site = await getSite(defaultLocale);
  const sitemap = buildSitemapUrl(site.seo.canonicalBase ?? site.domain ?? null);
  const disallow: string[] = ['/api/keystatic'];

  if (process.env.NODE_ENV === 'production') {
    disallow.unshift('/keystatic');
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap,
  } satisfies MetadataRoute.Robots;
}