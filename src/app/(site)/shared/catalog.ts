import type { Metadata } from 'next';

import { render } from '@/lib/markdoc';
import {
  CATALOG_AUXILIARIES,
  CATALOG_BASES,
  CATALOG_CATEGORIES,
  CATALOG_FILLERS,
  CATALOG_PROCESSES,
  getAllCatalogEntries,
  getCatalogItemBySlug,
  getCatalogItems,
  getSite,
  type CatalogItem,
  type CatalogListItem,
  type CatalogSummary,
  type CatalogAuxiliary,
  type CatalogBase,
  type CatalogCategory,
  type CatalogFiller,
  type CatalogProcess,
} from '@/lib/keystatic';
import { locales, type Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveAlternateOgLocales,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';

const LISTING_TITLE: Record<Locale, string> = {
  ru: 'Каталог',
  en: 'Catalog',
};

const LISTING_DESCRIPTION: Record<Locale, string> = {
  ru: 'Каталог материалов Интема Групп: связующие системы, противопригарные покрытия и вспомогательные продукты.',
  en: 'Intema Group product catalogue: binders, release coatings, and auxiliary supplies.',
};

export type CatalogProductPageData = {
  item: CatalogItem;
  content: Awaited<ReturnType<typeof render>>;
  summary: string | null;
};

export function getCatalogListing(locale: Locale): Promise<CatalogListItem[]> {
  return getCatalogItems(locale);
}

export async function getCatalogProductPage(locale: Locale, slug: string): Promise<CatalogProductPageData | null> {
  const item = await getCatalogItemBySlug(slug, locale);
  if (!item) {
    return null;
  }

  const content = await render(item.content, locale);
  const summary = item.excerpt;

  return { item, content, summary } satisfies CatalogProductPageData;
}

function buildCatalogSlugMap(slugByLocale: Partial<Record<Locale, string>>): Partial<Record<Locale, string>> {
  const record: Partial<Record<Locale, string>> = {};
  for (const locale of locales) {
    const slug = slugByLocale[locale];
    if (!slug) {
      continue;
    }
    record[locale] = buildPath(locale, ['catalog', slug]);
  }
  return record;
}

export async function resolveCatalogListingMetadata(locale: Locale): Promise<Metadata> {
  const site = await getSite(locale);
  const slugMap: Partial<Record<Locale, string>> = {};
  for (const candidate of locales) {
    slugMap[candidate] = buildPath(candidate, ['catalog']);
  }

  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });

  const merged = mergeSeo({
    site: site.seo,
    defaults: {
      title: LISTING_TITLE[locale],
      description: LISTING_DESCRIPTION[locale],
    },
  });

  const canonicalUrl = merged.canonicalOverride ?? alternates.canonical;
  const alternatesData: Metadata['alternates'] = { languages: alternates.languages };
  if (canonicalUrl) {
    alternatesData.canonical = canonicalUrl;
  }

  const ogImage = resolveOpenGraphImage(merged.ogImage, site.seo.canonicalBase);
  const ogTitle = merged.ogTitle ?? merged.title ?? LISTING_TITLE[locale];
  const ogDescription = merged.ogDescription ?? merged.description ?? LISTING_DESCRIPTION[locale];
  const hrefLang = HREFLANG_CODE[locale];
  const preferredUrl = canonicalUrl ?? alternates.languages[hrefLang];

  return {
    title: merged.title ?? LISTING_TITLE[locale],
    description: merged.description ?? LISTING_DESCRIPTION[locale],
    alternates: alternatesData,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      site: merged.twitterHandle,
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage.url] : undefined,
    },
  } satisfies Metadata;
}

export async function resolveCatalogProductMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const [site, item] = await Promise.all([getSite(locale), getCatalogItemBySlug(slug, locale)]);
  if (!item) {
    return {};
  }

  const slugMap = buildCatalogSlugMap(item.slugByLocale);
  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });

  const merged = mergeSeo({
    site: site.seo,
    defaults: {
      title: item.title,
      description: item.excerpt,
    },
  });

  const canonicalUrl = merged.canonicalOverride ?? alternates.canonical;
  const alternatesData: Metadata['alternates'] = { languages: alternates.languages };
  if (canonicalUrl) {
    alternatesData.canonical = canonicalUrl;
  }

  const hrefLang = HREFLANG_CODE[locale];
  const preferredUrl = canonicalUrl ?? alternates.languages[hrefLang];
  const alternateOgLocales = resolveAlternateOgLocales(locale, slugMap);
  const productImage = item.image
    ? {
        src: item.image.src,
        width: item.image.width ?? undefined,
        height: item.image.height ?? undefined,
        alt: item.title,
      }
    : null;
  const ogImage = resolveOpenGraphImage(merged.ogImage ?? productImage, site.seo.canonicalBase);
  const descriptionFallback = merged.description ?? item.excerpt ?? undefined;
  const ogDescriptionFallback = merged.ogDescription ?? descriptionFallback;
  const ogTitleFallback = merged.ogTitle ?? merged.title ?? item.title;

  return {
    title: merged.title ?? item.title,
    description: descriptionFallback,
    alternates: alternatesData,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'article',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      images: ogImage ? [ogImage] : undefined,
      alternateLocale: alternateOgLocales.length ? alternateOgLocales : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      site: merged.twitterHandle,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      images: ogImage ? [ogImage.url] : undefined,
    },
  } satisfies Metadata;
}

export async function getLocalizedCatalogParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const entries = await getAllCatalogEntries();
  const params: Array<{ locale: Locale; slug: string }> = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (!entry.published) {
      continue;
    }
    for (const locale of locales) {
      const slug = entry.slugByLocale[locale];
      if (!slug) {
        continue;
      }
      const key = `${locale}:${slug}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      params.push({ locale, slug });
    }
  }

  return params;
}

export { CATALOG_AUXILIARIES, CATALOG_BASES, CATALOG_CATEGORIES, CATALOG_FILLERS, CATALOG_PROCESSES };
export type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogFiller,
  CatalogProcess,
  CatalogSummary,
};