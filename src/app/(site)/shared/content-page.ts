import type { Metadata } from 'next';

import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getAllPages, getPageBySlug, getSite, type PageContent } from '@/lib/keystatic';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveAlternateOgLocales,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';
import { locales, type Locale } from '@/lib/i18n';

export type ContentPageData = {
  page: PageContent;
  content: Awaited<ReturnType<typeof render>>;
  summary: string | null;
};

type SlugMap = Partial<Record<Locale, string>>;

const buildSlugMap = (slugByLocale: Partial<Record<Locale, string>>): SlugMap => {
  const record: SlugMap = {};
  for (const candidate of locales) {
    const slug = slugByLocale[candidate];
    if (!slug) {
      continue;
    }
    record[candidate] = buildPath(candidate, slug ? [slug] : []);
  }
  return record;
};

export async function getContentPage(locale: Locale, slug: string): Promise<ContentPageData | null> {
  const page = await getPageBySlug(slug, locale);
  if (!page) {
    return null;
  }

  const content = await render(page.content, locale);
  const summary = page.description ?? page.excerpt ?? null;

  return { page, content, summary } satisfies ContentPageData;
}

export async function resolveContentPageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const [site, page] = await Promise.all([getSite(locale), getPageBySlug(slug, locale)]);
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
    twitter: {
      card: merged.ogImage ? 'summary_large_image' : 'summary',
      site: merged.twitterHandle,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      images: ogImage ? [ogImage.url] : undefined,
    },
  } satisfies Metadata;
}

export async function getLocalizedPageParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const pages = await getAllPages();
  const params: { locale: Locale; slug: string }[] = [];

  for (const page of pages) {
    if (!page.published) {
      continue;
    }
    for (const locale of locales) {
      const slug = page.slugByLocale[locale];
      if (!slug) {
        continue;
      }
      params.push({ locale, slug });
    }
  }

  return params;
}

export async function getDefaultLocalePageSlugs(defaultLocale: Locale): Promise<string[]> {
  const params = await getLocalizedPageParams();
  return params
    .filter((entry) => entry.locale === defaultLocale)
    .map((entry) => entry.slug)
    .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
    .filter((slug, index, all) => all.indexOf(slug) === index);
}