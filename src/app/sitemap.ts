import type { MetadataRoute } from 'next';
import { getSitemapContentEntries } from '@/lib/keystatic';
import { defaultLocale, locales, localizePath, type Locale } from '@/lib/i18n';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { buildAlternates } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const contentEntries = await getSitemapContentEntries();

  for (const entry of contentEntries) {
    const slugByLocale = Object.fromEntries(
      Object.entries(entry.slugByLocale).map(([key, value]) => [
        key,
        entry.collection === 'posts' && value ? `posts/${value}` : value,
      ])
    ) as Partial<Record<Locale, string>>;

    const { languages } = buildAlternates({ locale: defaultLocale, slugByLocale });

    for (const locale of locales) {
      const localizedSlug = slugByLocale[locale];
      if (localizedSlug === undefined) {
        continue;
      }

      const url = languages[locale] ?? buildAbsoluteUrl(localizePath(locale, localizedSlug));

      entries.push({
        url,
        alternates: {
          languages,
        },
        changeFrequency: localizedSlug === '' ? 'weekly' : 'monthly',
        priority: localizedSlug === '' ? 0.9 : undefined,
        lastModified: entry.lastModified ? new Date(entry.lastModified) : undefined,
      });
    }
  }

  return entries;
}