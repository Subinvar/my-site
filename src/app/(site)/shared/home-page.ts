import { cache } from 'react';
import type { Metadata } from 'next';

import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getAllPages, getPageById, getSite, type PageContent } from '@/lib/keystatic';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveAlternateOgLocales,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';

const HOME_PAGE_ID = 'home';

export type HomePageData = {
  page: PageContent;
  content: Awaited<ReturnType<typeof render>>;
  summary: string | null;
};

type SlugMap = Partial<Record<Locale, string>>;

const buildSlugMap = (slugByLocale: Partial<Record<Locale, string>>): SlugMap => {
  const record: SlugMap = {};
  for (const candidate of locales) {
    const slug = slugByLocale[candidate];
    if (slug === undefined) {
      continue;
    }
    const segments = slug ? [slug] : [];
    record[candidate] = buildPath(candidate, segments);
  }
  return record;
};

export const getHomePage = cache(async (locale: Locale): Promise<HomePageData | null> => {
  const page = await getPageById(HOME_PAGE_ID, locale);
  if (!page) {
    return null;
  }

  const content = await render(page.content, locale);
  const summary = page.description ?? page.excerpt ?? null;

  return { page, content, summary } satisfies HomePageData;
});

export const resolveHomeMetadata = cache(async (locale: Locale): Promise<Metadata> => {
  const [site, page] = await Promise.all([getSite(locale), getPageById(HOME_PAGE_ID, locale)]);
  if (!page) {
    return {};
  }

  const slugMap = buildSlugMap(page.slugByLocale);
  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });
  const merged = mergeSeo({
    site: site.seo,
    page: page.seo,
    defaults: {
      title: page.title,
      description: page.description ?? page.excerpt ?? null,
    },
  });

  const canonicalUrl = merged.canonicalOverride ?? alternates.canonical;
  const alternatesData: Metadata['alternates'] = {
    languages: alternates.languages,
  };
  if (canonicalUrl) {
    alternatesData.canonical = canonicalUrl;
  }

  const currentHrefLang = HREFLANG_CODE[locale];
  const preferredUrl = canonicalUrl ?? alternates.languages[currentHrefLang];
  const ogImage = resolveOpenGraphImage(merged.ogImage, site.seo.canonicalBase);
  const alternateOgLocales = resolveAlternateOgLocales(locale, slugMap);
  const descriptionFallback = merged.description ?? page.description ?? page.excerpt ?? undefined;
  const ogDescriptionFallback = merged.ogDescription ?? descriptionFallback;
  const ogTitleFallback = merged.ogTitle ?? merged.title ?? page.title;

  return {
    title: merged.title ?? page.title,
    description: descriptionFallback,
    alternates: alternatesData,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      alternateLocale: alternateOgLocales.length ? alternateOgLocales : undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  } satisfies Metadata;
});

export async function getHomeStaticLocales(): Promise<Locale[]> {
  const pages = await getAllPages();
  const home = pages.find((entry) => entry.id === HOME_PAGE_ID);
  if (!home || !home.published) {
    return [];
  }

  const params: Locale[] = [];
  const seen = new Set<Locale>();
  for (const locale of locales) {
    const slug = home.slugByLocale?.[locale];
    if (slug === undefined || seen.has(locale)) {
      continue;
    }
    seen.add(locale);
    params.push(locale);
  }

  if (!params.length && home.slugByLocale?.[defaultLocale] !== undefined) {
    params.push(defaultLocale);
  }

  return params;
}