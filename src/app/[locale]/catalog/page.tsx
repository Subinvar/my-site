import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  AUXILIARY_CATEGORY,
  CATALOG_AUXILIARIES,
  CATALOG_BASES,
  CATALOG_CATEGORIES,
  CATALOG_FILLERS,
  CATALOG_PROCESSES,
  getCatalogListing,
  getCatalogListingPage,
  getCatalogTaxonomyOptions,
  resolveCatalogListingMetadata,
} from '@/app/(site)/shared/catalog';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, buildPath } from '@/lib/paths';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n';
import type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogFiller,
  CatalogListItem,
  CatalogProcess,
  CatalogPageContent,
} from '@/lib/keystatic';

export const revalidate = 60;

type PageProps = {
  params: { locale: Locale } | Promise<{ locale: Locale }>;
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

type FilterState = {
  category: CatalogCategory | null;
  process: CatalogProcess[];
  base: CatalogBase[];
  filler: CatalogFiller[];
  auxiliary: CatalogAuxiliary[];
};

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await Promise.resolve(params);
  const rawSearchParams = await Promise.resolve(searchParams ?? {});

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
  const filteredItems = applyFilters(items, filters);
  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['catalog']);
  const heading = resolveHeading(catalogPage, locale);
  const description = resolveDescription(catalogPage, locale);
  const submitLabel = resolveSubmitLabel(catalogPage, locale);
  const resetLabel = resolveResetLabel(catalogPage, locale);
  const categoryAllLabel = resolveCategoryAllLabel(catalogPage, locale);
  const detailLabel = resolveDetailLabel(catalogPage, locale);
  const emptyStateMessage = resolveEmptyState(catalogPage, locale);
  const groupLabels = resolveGroupLabels(catalogPage, locale);

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
    >
      <div className="space-y-12">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-zinc-900">{heading}</h1>
          <p className="text-base text-zinc-600">{description}</p>
        </header>
        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <form className="space-y-6" method="get">
            <fieldset>
              <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {groupLabels.category}
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    defaultChecked={!filters.category}
                    className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  {categoryAllLabel}
                </label>
                {taxonomyOptions.categories.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="radio"
                      name="category"
                      value={option.value}
                      defaultChecked={filters.category === option.value}
                      className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <FilterGroup
              name="process"
              legend={groupLabels.process}
              options={taxonomyOptions.processes}
              selected={filters.process}
            />
            <FilterGroup
              name="base"
              legend={groupLabels.base}
              options={taxonomyOptions.bases}
              selected={filters.base}
            />
            <FilterGroup
              name="filler"
              legend={groupLabels.filler}
              options={taxonomyOptions.fillers}
              selected={filters.filler}
            />
            <FilterGroup
              name="auxiliary"
              legend={groupLabels.auxiliary}
              options={taxonomyOptions.auxiliaries}
              selected={filters.auxiliary}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {submitLabel}
              </button>
              <Link
                href={buildPath(locale, ['catalog'])}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {resetLabel}
              </Link>
            </div>
          </form>
        </section>
        <section>
          {filteredItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
              {emptyStateMessage}
            </p>
          ) : (
            <ul className="grid gap-8 md:grid-cols-2">
              {filteredItems.map((item) => (
                <li key={`${item.id}:${item.slug}`}>
                  <CatalogCard item={item} locale={locale} detailLabel={detailLabel} />
                </li>
              ))}
            </ul>
          )}
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

function parseFilters(params: Record<string, string | string[] | undefined>): FilterState {
  const categoryValue = toSingle(params.category);
  const category = categoryValue && CATALOG_CATEGORIES.includes(categoryValue as CatalogCategory)
    ? (categoryValue as CatalogCategory)
    : null;

  return {
    category,
    process: toMulti<CatalogProcess>(params.process, CATALOG_PROCESSES),
    base: toMulti<CatalogBase>(params.base, CATALOG_BASES),
    filler: toMulti<CatalogFiller>(params.filler, CATALOG_FILLERS),
    auxiliary: toMulti<CatalogAuxiliary>(params.auxiliary, CATALOG_AUXILIARIES),
  } satisfies FilterState;
}

function applyFilters(items: CatalogListItem[], filters: FilterState): CatalogListItem[] {
  const shouldFilterAuxiliary = filters.auxiliary.length > 0 && filters.category === AUXILIARY_CATEGORY;
  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    if (filters.process.length > 0 && !hasIntersection(item.process, filters.process)) {
      return false;
    }
    if (filters.base.length > 0 && !hasIntersection(item.base, filters.base)) {
      return false;
    }
    if (filters.filler.length > 0 && !hasIntersection(item.filler, filters.filler)) {
      return false;
    }
    if (shouldFilterAuxiliary) {
      if (item.category !== AUXILIARY_CATEGORY) {
        return false;
      }
      if (!hasIntersection(item.auxiliary, filters.auxiliary)) {
        return false;
      }
    }
    return true;
  });
}

function toSingle(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
}

function toMulti<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T[] {
  const rawValues = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  const unique = new Set<T>();
  for (const candidate of rawValues) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }
    if (allowed.includes(trimmed as T)) {
      unique.add(trimmed as T);
    }
  }
  return Array.from(unique);
}

function hasIntersection<T extends string>(collection: readonly T[], filters: readonly T[]): boolean {
  if (!collection.length) {
    return false;
  }
  for (const value of filters) {
    if (collection.includes(value)) {
      return true;
    }
  }
  return false;
}

type FilterOption<T extends string> = { value: T; label: string };

type FilterGroupProps<T extends string> = {
  name: string;
  legend: string;
  options: ReadonlyArray<FilterOption<T>>;
  selected: readonly T[];
};

function FilterGroup<T extends string>({ name, legend, options, selected }: FilterGroupProps<T>) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-3">
        {options.map((option) => {
          const id = buildOptionId(name, option.value);
          return (
            <label key={option.value} htmlFor={id} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                id={id}
                type="checkbox"
                name={name}
                value={option.value}
                defaultChecked={selected.includes(option.value)}
                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

type CatalogCardProps = {
  item: CatalogListItem;
  locale: Locale;
  detailLabel: string;
};

function CatalogCard({ item, locale, detailLabel }: CatalogCardProps) {
  const image = item.image;
  const href = buildPath(locale, ['catalog', item.slug]);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {image ? (
        <div className="relative h-48 w-full">
          <Image
            src={image.src}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-zinc-900">{item.title}</h2>
          {item.excerpt ? <p className="text-sm text-zinc-600">{item.excerpt}</p> : null}
        </div>
        <div className="mt-auto">
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {detailLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function buildOptionId(group: string, value: string): string {
  const normalized = encodeURIComponent(value).replace(/%/g, '').toLowerCase();
  return `${group}-${normalized || 'option'}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await Promise.resolve(params);
  if (!isLocale(rawLocale)) {
    return {};
  }
  return resolveCatalogListingMetadata(rawLocale);
}