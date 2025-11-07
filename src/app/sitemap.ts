import type { MetadataRoute } from 'next';
import { getSitemapContentEntries } from '@/lib/keystatic';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, localizePath } from '@/lib/i18n';
import { buildAbsoluteUrl } from '@/lib/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const contentEntries = await getSitemapContentEntries();

  for (const entry of contentEntries) {
    const languageAlternates: Record<string, string> = {};
    for (const locale of SUPPORTED_LOCALES) {
      const localizedSlug = entry.localizedSlugs[locale];
      if (localizedSlug === undefined) {
        continue;
      }
      const localizedPath = entry.collection === 'posts' ? `posts/${localizedSlug}` : localizedSlug;
      languageAlternates[locale] = buildAbsoluteUrl(localizePath(locale, localizedPath));
    }

    if (languageAlternates[DEFAULT_LOCALE]) {
      languageAlternates['x-default'] = languageAlternates[DEFAULT_LOCALE];
    }

    for (const locale of SUPPORTED_LOCALES) {
      const localizedSlug = entry.localizedSlugs[locale];
      if (localizedSlug === undefined) {
        continue;
      }

      const localizedPath = entry.collection === 'posts' ? `posts/${localizedSlug}` : localizedSlug;
      const url = buildAbsoluteUrl(localizePath(locale, localizedPath));

      entries.push({
        url,
        alternates: {
          languages: languageAlternates,
        },
        changeFrequency: localizedSlug === '' ? 'weekly' : 'monthly',
        priority: localizedSlug === '' ? 0.9 : undefined,
        lastModified: entry.lastModified ? new Date(entry.lastModified) : undefined,
      });
    }
  }

  return entries;
}