import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { SiteShell } from '../(site)/shared/site-shell';
import { getSiteShellData } from '../(site)/shared/site-shell-data';
import { buildPath, findTargetLocale, switchLocalePath, type EntityWithLocalizedSlugs } from '@/lib/paths';
import { getPageBySlug, getPostBySlug, getSite } from '@/lib/keystatic';
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
import { geistMono, geistSans } from '../fonts';

type LocaleRouteParams = {
  locale: string;
  [key: string]: string | string[];
};

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<LocaleRouteParams>;
};

async function resolveEntityForParams(
  locale: Locale,
  params: Partial<LocaleRouteParams>
): Promise<EntityWithLocalizedSlugs | undefined> {
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[slugParam.length - 1] : slugParam;

  if (typeof slug === 'string' && slug.length > 0) {
    const page = await getPageBySlug(slug, locale);
    if (page) {
      return { collection: 'pages', slugs: page.slugByLocale };
    }

    const post = await getPostBySlug(slug, locale);
    if (post) {
      return { collection: 'posts', slugs: post.slugByLocale };
    }
  }

  if (typeof params.locale === 'string') {
    return { collection: 'pages', slugs: { [locale]: '' } };
  }

  return undefined;
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const locale = rawLocale;
  const site = await getSite(locale);
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
  const paramsRecord = await params;
  const { locale: rawLocale } = paramsRecord;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [{ site, navigation }, entity] = await Promise.all([
    getSiteShellData(locale),
    resolveEntityForParams(locale, paramsRecord),
  ]);

  const targetLocale = findTargetLocale(locale);
  const switcherHref = entity
    ? switchLocalePath(locale, targetLocale, entity)
    : switchLocalePath(locale, targetLocale);

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-white text-zinc-900 antialiased">
        <SiteShell
          locale={locale}
          targetLocale={targetLocale}
          site={site}
          navigation={navigation}
          switcherHref={switcherHref}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}