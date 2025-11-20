import type { Metadata } from 'next';
import { cache, type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { buildPath } from '@/lib/paths';
import { getSite } from '@/lib/keystatic';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveAlternateOgLocales,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';
import { isLocale, locales, type Locale } from '@/lib/i18n';

type LocaleRouteParams = {
  locale: string;
};

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<LocaleRouteParams>;
};

const getCachedSite = cache(getSite);

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const locale = rawLocale;
  const site = await getCachedSite(locale);
  const merged = mergeSeo({ site: site.seo });

  const slugMap = locales.reduce<Partial<Record<Locale, string>>>((acc, candidate) => {
    acc[candidate] = buildPath(candidate);
    return acc;
  }, {});

  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });

  const currentHrefLang = HREFLANG_CODE[locale];
  const pageUrl = alternates.languages[currentHrefLang] ?? alternates.canonical;
  const ogImage = resolveOpenGraphImage(merged.ogImage, site.seo.canonicalBase);
  const alternateOgLocales = resolveAlternateOgLocales(locale, slugMap);

  return {
    title: merged.title,
    description: merged.description,
    alternates,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: pageUrl,
      title: merged.ogTitle ?? merged.title,
      description: merged.ogDescription ?? merged.description,
      alternateLocale: alternateOgLocales.length ? alternateOgLocales : undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: merged.ogImage ? 'summary_large_image' : 'summary',
      site: merged.twitterHandle,
      title: merged.ogTitle ?? merged.title,
      description: merged.ogDescription ?? merged.description,
      images: ogImage ? [ogImage.url] : undefined,
    },
  } satisfies Metadata;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  await getCachedSite(rawLocale);

  return (
    <>
      {children}
      <Analytics />
      <SpeedInsights />
    </>
  );
}