import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogFilters, type CatalogFilterValues } from '@/app/(site)/shared/filter-controls';
import { CatalogListing } from '@/app/(site)/shared/catalog-listing';
import { parseFilters } from '@/app/(site)/shared/catalog-filtering';
import {
  getCatalogListing,
  getCatalogListingPage,
  getCatalogTaxonomyOptions,
  resolveCatalogListingMetadata,
} from '@/app/(site)/shared/catalog';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, buildPath } from '@/lib/paths';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n';
import type { CatalogPageContent } from '@/lib/keystatic';

export const dynamic = 'force-dynamic';

export const revalidate = 0;

type PageParams = { locale: Locale };

type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const rawSearchParams = await (searchParams ?? Promise.resolve({}));

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const filters = parseFilters(rawSearchParams);
  const taxonomyOptions = getCatalogTaxonomyOptions(locale);
  const [items, shell, catalogPage] = await Promise.all([
    getCatalogListing(locale),
    getSiteShellData(locale),
    getCatalogListingPage(locale),
  ]);
  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['catalog']);
  const currentPath = buildPath(locale, ['catalog']);
  const heading = resolveHeading(catalogPage, locale);
  const description = resolveDescription(catalogPage, locale);
  const submitLabel = resolveSubmitLabel(catalogPage, locale);
  const resetLabel = resolveResetLabel(catalogPage, locale);
  const categoryAllLabel = resolveCategoryAllLabel(catalogPage, locale);
  const detailLabel = resolveDetailLabel(catalogPage, locale);
  const emptyStateMessage = resolveEmptyState(catalogPage, locale);
  const groupLabels = resolveGroupLabels(catalogPage, locale);
  const initialFilterValues: CatalogFilterValues = {
    category: filters.category,
    process: filters.process.values,
    base: filters.base.values,
    filler: filters.filler.values,
    auxiliary: filters.auxiliary.values,
  };

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
    >
      <div className="space-y-12">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-zinc-900">{heading}</h1>
          <p className="text-base text-zinc-600">{description}</p>
        </header>
        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <CatalogFilters
            taxonomyOptions={taxonomyOptions}
            groupLabels={groupLabels}
            categoryAllLabel={categoryAllLabel}
            submitLabel={submitLabel}
            resetLabel={resetLabel}
            initialValues={initialFilterValues}
          />
        </section>
        <section>
          <CatalogListing
            items={items}
            initialFilters={filters}
            emptyStateMessage={emptyStateMessage}
            detailLabel={detailLabel}
            locale={locale}
          />
        </section>
      </div>
    </SiteShell>
  );
}

function resolveLocalizedValue(
  record: Partial<Record<Locale, string>> | null | undefined,
  locale: Locale
): string {
  const localized = record?.[locale];
  if (localized && localized.trim()) {
    return localized;
  }
  const fallback = record?.[defaultLocale];
  if (fallback && fallback.trim()) {
    return fallback;
  }
  for (const candidate of locales) {
    const value = record?.[candidate];
    if (value && value.trim()) {
      return value;
    }
  }
  return '';
}

function resolveHeading(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.title ?? null, locale);
}

function resolveDescription(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.description ?? null, locale);
}

function resolveSubmitLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.submitLabel ?? null, locale);
}

function resolveResetLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.resetLabel ?? null, locale);
}

function resolveCategoryAllLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.categoryAllLabel ?? null, locale);
}

function resolveDetailLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.detailLabel ?? null, locale);
}

function resolveEmptyState(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.emptyStateMessage ?? null, locale);
}

function resolveGroupLabels(
  page: CatalogPageContent | null,
  locale: Locale
): { category: string; process: string; base: string; filler: string; auxiliary: string } {
  const source = page?.groupLabels;
  return {
    category: resolveLocalizedValue(source?.category ?? null, locale),
    process: resolveLocalizedValue(source?.process ?? null, locale),
    base: resolveLocalizedValue(source?.base ?? null, locale),
    filler: resolveLocalizedValue(source?.filler ?? null, locale),
    auxiliary: resolveLocalizedValue(source?.auxiliary ?? null, locale),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await Promise.resolve(params);
  if (!isLocale(rawLocale)) {
    return {};
  }
  return resolveCatalogListingMetadata(rawLocale);
}