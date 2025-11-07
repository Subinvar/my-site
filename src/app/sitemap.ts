import type { MetadataRoute } from 'next';
import { getAllPageSlugs, getAllPostSlugs } from '@/lib/keystatic';
import { SUPPORTED_LOCALES, localizePath } from '@/lib/i18n';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    entries.push({
      url: new URL(localizePath(locale, ''), siteUrl).toString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    const [pages, posts] = await Promise.all([
      getAllPageSlugs(locale),
      getAllPostSlugs(locale),
    ]);

    for (const slug of pages) {
      if (!slug) continue;
      entries.push({
        url: new URL(localizePath(locale, slug), siteUrl).toString(),
        changeFrequency: 'monthly',
      });
    }

    for (const slug of posts) {
      entries.push({
        url: new URL(localizePath(locale, `posts/${slug}`), siteUrl).toString(),
        changeFrequency: 'monthly',
      });
    }
  }

  return entries;
}