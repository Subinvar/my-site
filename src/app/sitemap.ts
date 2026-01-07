import type { MetadataRoute } from 'next';

import { getAllCatalogEntries, getAllPages, getAllPosts, getProductsPage, getSite } from '@/lib/keystatic';
import { buildPath } from '@/lib/paths';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';
import { HREFLANG_CODE } from '@/lib/seo';
import { normalizeBaseUrl, resolvePublicBaseUrl } from '@/lib/url';
import { getProductsHubGroupsForSitemap } from '@/lib/content/products-hub';

type Collection = 'pages' | 'posts' | 'catalog';

type DatedEntry = {
  collection: Collection;
  slugByLocale: Partial<Record<Locale, string | null | undefined>>;
  updatedAt?: string | null;
  date?: string | null;
};

const splitSlug = (slug: string): string[] =>
  slug
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

const buildSegments = (collection: Collection, slug: string): string[] => {
  const segments = splitSlug(slug);

  if (collection === 'posts') {
    return ['news', ...segments];
  }
  if (collection === 'catalog') {
    return ['catalog', ...segments];
  }
  return segments;
};

const toAbsoluteUrl = (
  baseUrl: string | null,
  path: string,
  fallbackBaseUrl?: string | null
): string | null => {
  const resolvedBaseUrl =
    normalizeBaseUrl(baseUrl) ??
    normalizeBaseUrl(fallbackBaseUrl) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  if (!resolvedBaseUrl) {
    return null;
  }

  try {
    return new URL(path, resolvedBaseUrl).toString();
  } catch {
    return null;
  }
};

const buildLocalizedUrls = (
  baseUrl: string | null,
  { collection, slugByLocale }: Pick<DatedEntry, 'collection' | 'slugByLocale'>,
  fallbackBaseUrl?: string | null
): Partial<Record<Locale, string>> => {
  const record: Partial<Record<Locale, string>> = {};
  if (!slugByLocale) {
    return record;
  }
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
    const absoluteUrl = toAbsoluteUrl(baseUrl, relative, fallbackBaseUrl);
    if (absoluteUrl) {
      record[locale] = absoluteUrl;
    }
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
  baseUrl: string,
  entry: DatedEntry
): MetadataRoute.Sitemap => {
  const urls = buildLocalizedUrls(baseUrl, entry, baseUrl);
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
  const [site, pages, posts, catalogEntries, productsPage, productsHubGroups] = await Promise.all([
    getSite(defaultLocale),
    getAllPages(),
    getAllPosts(),
    getAllCatalogEntries(),
    getProductsPage(defaultLocale),
    getProductsHubGroupsForSitemap(),
  ]);

  const baseUrl = resolvePublicBaseUrl(site.seo.canonicalBase ?? null, {
    fallbackHost: site.domain,
  });

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

  const productsEntries = productsPage.published
    ? createSitemapEntries(baseUrl, {
        collection: 'pages',
        slugByLocale: productsPage.slugByLocale,
        updatedAt: productsPage.updatedAt,
      })
    : [];

  const productGroupEntries = productsPage.published
    ? productsHubGroups
        .filter((group) => !group.hidden)
        .flatMap((group) => {
          const slugByLocale: Partial<Record<Locale, string>> = {};

          for (const locale of locales) {
            const baseSlug = (productsPage.slugByLocale[locale] ?? productsPage.slugByLocale[defaultLocale] ?? 'products')
              .replace(/^\/+/g, '')
              .replace(/\/+$/g, '');
            const groupSlug = (group.slugByLocale[locale] ?? group.slugByLocale[defaultLocale] ?? group.id)
              .replace(/^\/+/g, '')
              .replace(/\/+$/g, '');
            if (!baseSlug || !groupSlug) {
              continue;
            }
            slugByLocale[locale] = `${baseSlug}/${groupSlug}`;
          }

          return createSitemapEntries(baseUrl, {
            collection: 'pages',
            slugByLocale,
            updatedAt: productsPage.updatedAt,
          });
        })
    : [];

  return [...pageEntries, ...postEntries, ...catalogEntriesUrls, ...documentsEntries, ...productsEntries, ...productGroupEntries];
}
