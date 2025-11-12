import type { MetadataRoute } from 'next';

import { getAllPages, getAllPosts, getSite } from '@/lib/keystatic';
import { buildPath } from '@/lib/paths';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';

type Collection = 'pages' | 'posts';

type DatedEntry = {
  collection: Collection;
  slugByLocale: Partial<Record<Locale, string | null | undefined>>;
  updatedAt?: string | null;
  date?: string | null;
};

const buildSegments = (collection: Collection, slug: string): string[] => {
  if (collection === 'posts') {
    return ['posts', slug];
  }
  return slug.length ? [slug] : [];
};

const toAbsoluteUrl = (baseUrl: string | null, path: string): string => {
  if (!baseUrl) {
    return path;
  }
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
};

const buildLocalizedUrls = (
  baseUrl: string | null,
  { collection, slugByLocale }: Pick<DatedEntry, 'collection' | 'slugByLocale'>
): Partial<Record<Locale, string>> => {
  const record: Partial<Record<Locale, string>> = {};
  for (const locale of locales) {
    const raw = slugByLocale[locale];
    if (raw === undefined || raw === null) {
      continue;
    }
    const normalized = collection === 'posts' ? raw.trim() : raw.trim();
    if (collection === 'posts' && !normalized) {
      continue;
    }
    const segments = buildSegments(collection, normalized);
    const relative = buildPath(locale, segments);
    record[locale] = toAbsoluteUrl(baseUrl, relative);
  }

  return record;
};
const toLastModified = (entry: DatedEntry): Date | undefined => {
  const source = entry.updatedAt ?? entry.date;
  if (!source) {
    return undefined;
  }
  const timestamp = Date.parse(source);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }
  return new Date(timestamp);
};

const createSitemapRecords = (baseUrl: string | null, entry: DatedEntry): MetadataRoute.Sitemap => {
  const urls = buildLocalizedUrls(baseUrl, entry);
  const ruUrl = urls.ru;
  const enUrl = urls.en;
  if (!ruUrl || !enUrl) {
    return [];
  }
  const lastModified = toLastModified(entry);
  const alternates = { languages: { ru: ruUrl, en: enUrl } } as const;
  return [
    { url: ruUrl, lastModified, alternates },
    { url: enUrl, lastModified, alternates },
  ];
};

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, pages, posts] = await Promise.all([
    getSite(defaultLocale),
    getAllPages(),
    getAllPosts(),
  ]);

  const baseUrl = site.seo.canonicalBase ?? null;

  const pageEntries = pages
    .filter((page) => page.published)
    .flatMap((page) =>
      createSitemapRecords(baseUrl, {
        collection: 'pages',
        slugByLocale: page.slugByLocale,
        updatedAt: page.updatedAt,
      })
    );

  const postEntries = posts
    .filter((post) => post.published)
    .flatMap((post) =>
      createSitemapRecords(baseUrl, {
        collection: 'posts',
        slugByLocale: post.slugByLocale,
        updatedAt: post.updatedAt,
        date: post.date,
      })
    );

  return [...pageEntries, ...postEntries];
}