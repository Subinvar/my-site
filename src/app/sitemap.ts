import type { MetadataRoute } from 'next';

import { getAllCatalogEntries, getAllPages, getAllPosts, getSite } from '@/lib/keystatic';
import { buildPath } from '@/lib/paths';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';
import { HREFLANG_CODE } from '@/lib/seo';
import { normalizeBaseUrl } from '@/lib/url';

type Collection = 'pages' | 'posts' | 'catalog';

type DatedEntry = {
  collection: Collection;
  slugByLocale: Partial<Record<Locale, string | null | undefined>>;
  updatedAt?: string | null;
  date?: string | null;
};

const buildSegments = (collection: Collection, slug: string): string[] => {
  if (collection === 'posts') {
    return ['news', slug];
  }
  if (collection === 'catalog') {
    return ['catalog', slug];
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
    const normalized = raw.trim();
    if (collection === 'posts' && normalized.length === 0) {
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

const buildAlternateLanguages = (
  alternates: Partial<Record<Locale, string>>
): Record<string, string> | undefined => {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    const href = alternates[locale];
    if (!href) {
      continue;
    }
    languages[HREFLANG_CODE[locale]] = href;
  }

  const defaultHref = alternates[defaultLocale];
  if (defaultHref) {
    languages['x-default'] = defaultHref;
  }

  return Object.keys(languages).length ? languages : undefined;
};

const createSitemapEntries = (
  baseUrl: string | null,
  entry: DatedEntry
): MetadataRoute.Sitemap => {
  const urls = buildLocalizedUrls(baseUrl, entry);
  const lastModified = toLastModified(entry);
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const url = urls[locale];
    if (!url) {
      continue;
    }

    const languages = buildAlternateLanguages(urls);
    entries.push({
      url,
      lastModified,
      alternates: languages ? { languages } : undefined,
    });
  }

  return entries;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, pages, posts, catalogEntries] = await Promise.all([
    getSite(defaultLocale),
    getAllPages(),
    getAllPosts(),
    getAllCatalogEntries(),
  ]);

  const baseUrl = normalizeBaseUrl(site.seo.canonicalBase ?? null);

  const pageEntries = pages
    .filter((page) => page.published)
    .flatMap((page) =>
      createSitemapEntries(baseUrl, {
        collection: 'pages',
        slugByLocale: page.slugByLocale,
        updatedAt: page.updatedAt,
      })
    );

  const postEntries = posts
    .filter((post) => post.published)
    .flatMap((post) =>
      createSitemapEntries(baseUrl, {
        collection: 'posts',
        slugByLocale: post.slugByLocale,
        updatedAt: post.updatedAt,
        date: post.date,
      })
    );

  const catalogEntriesUrls = catalogEntries
    .filter((entry) => entry.published)
    .flatMap((entry) =>
      createSitemapEntries(baseUrl, {
        collection: 'catalog',
        slugByLocale: entry.slugByLocale,
        updatedAt: entry.updatedAt,
      })
    );

  const documentsEntries = createSitemapEntries(baseUrl, {
    collection: 'pages',
    slugByLocale: {
      ru: 'documents',
      en: 'documents',
    },
  });

  return [...pageEntries, ...postEntries, ...catalogEntriesUrls, ...documentsEntries];
}
