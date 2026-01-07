import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSite, getProductsPage, getProductsPageSeo } from '@/lib/keystatic';
import { getProductsHubContent, getProductsHubGroupsForSitemap } from '@/lib/content/products-hub';
import { buildPath, findTargetLocale } from '@/lib/paths';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveAlternateOgLocales,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n';
import { ProductsPageClient } from '../products-page-client';

type PageProps = {
  params: Promise<{ locale: string; groupSlug: string }>;
};

const normalizeSlug = (value: string): string => value.trim().replace(/^\/+|\/+$/g, '');

const splitSlug = (value: string): string[] =>
  normalizeSlug(value)
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

const resolveProductsBaseSegments = (slugByLocale: Partial<Record<Locale, string>>, locale: Locale): string[] => {
  const raw = slugByLocale[locale] ?? slugByLocale[defaultLocale] ?? 'products';
  const normalized = normalizeSlug(raw);
  return splitSlug(normalized.length ? normalized : 'products');
};

export default async function ProductsGroupPage({ params }: PageProps) {
  const { locale: rawLocale, groupSlug: rawGroupSlug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const groupSlug = normalizeSlug(rawGroupSlug);
  const targetLocale = findTargetLocale(locale);

  const [shell, productsPage, hubContent, targetHubContent] = await Promise.all([
    getSiteShellData(locale),
    getProductsPage(locale),
    getProductsHubContent(locale),
    getProductsHubContent(targetLocale),
  ]);

  const groups = hubContent.groups ?? [];
  const group = groups.find((candidate) => {
    const candidateSlug = normalizeSlug(candidate.slug ?? candidate.id);
    return candidateSlug === groupSlug || normalizeSlug(candidate.id) === groupSlug;
  });

  if (!group) {
    notFound();
  }

  const pageTitle = group.title ?? (locale === 'ru' ? 'Продукция' : 'Products');

  const baseSegments = resolveProductsBaseSegments(productsPage.slugByLocale, locale);

  const currentPath = buildPath(locale, [...baseSegments, group.slug]);
  const switcherTargetGroup = targetHubContent.groups?.find((item) => item.id === group.id) ?? null;
  const targetBaseSegments = resolveProductsBaseSegments(productsPage.slugByLocale, targetLocale);
  const switcherHref = buildPath(targetLocale, [...targetBaseSegments, switcherTargetGroup?.slug ?? group.slug]);

  const insights = hubContent.insights ?? [];
  const sortedInsights = [...insights].sort((a, b) => a.order - b.order);

  return (
    <SiteShellLayout
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
      currentYear={shell.currentYear}
    >
      <main id="main" className="page-shell">
        <h1 className="sr-only">{pageTitle}</h1>
        <ProductsPageClient locale={locale} groups={[group]} insights={sortedInsights} />
      </main>
    </SiteShellLayout>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, groupSlug: rawGroupSlug } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }

  const locale = rawLocale;
  const groupSlug = normalizeSlug(rawGroupSlug);

  const [site, productsPage, pageSeo, groupSlugs] = await Promise.all([
    getSite(locale),
    getProductsPage(locale),
    getProductsPageSeo(locale),
    getProductsHubGroupsForSitemap(),
  ]);

  const baseSegmentsForLocale = (candidateLocale: Locale) =>
    resolveProductsBaseSegments(productsPage.slugByLocale, candidateLocale);

  const matchingGroup = groupSlugs.find((candidate) => {
    const ruSlug = normalizeSlug(candidate.slugByLocale.ru ?? candidate.id);
    const enSlug = normalizeSlug(candidate.slugByLocale.en ?? candidate.id);
    return groupSlug === ruSlug || groupSlug === enSlug || groupSlug === normalizeSlug(candidate.id);
  });

  if (!matchingGroup) {
    return {};
  }

  const slugMap: Partial<Record<Locale, string>> = {};
  for (const candidateLocale of locales) {
    const baseSegments = baseSegmentsForLocale(candidateLocale);
    const groupSegment = normalizeSlug(matchingGroup.slugByLocale[candidateLocale] ?? matchingGroup.id);
    if (groupSegment) {
      slugMap[candidateLocale] = buildPath(candidateLocale, [...baseSegments, groupSegment]);
    }
  }

  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });

  // Для групповых страниц используем SEO от «Настройки страницы», но игнорируем canonicalOverride:
  // canonical должен строиться от slug'ов, а не от ручного override для главной страницы.
  const pageSeoForGroup = pageSeo ? { ...pageSeo, canonicalOverride: null } : null;

  const fallbackTitle = locale === 'ru' ? 'Продукция' : 'Products';
  const merged = mergeSeo({
    site: site.seo,
    page: pageSeoForGroup,
    defaults: { title: fallbackTitle, description: null },
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

  const description = merged.description ?? undefined;
  const ogDescription = merged.ogDescription ?? description;
  const ogTitle = merged.ogTitle ?? merged.title ?? fallbackTitle;

  return {
    title: merged.title ?? fallbackTitle,
    description,
    alternates: alternatesData,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: ogTitle,
      description: ogDescription,
      alternateLocale: alternateOgLocales.length ? alternateOgLocales : undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  } satisfies Metadata;
}
