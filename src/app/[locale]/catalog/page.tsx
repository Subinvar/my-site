import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  CatalogFilters,
  CatalogFiltersMobileTrigger,
} from '@/components/catalog/catalog-filters';
import type { CatalogFiltersProps } from '@/components/catalog/catalog-filters';
import { ActiveFiltersChips } from '@/components/catalog/active-filters-chips';
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar';
import { CatalogList } from '@/components/catalog/catalog-list';
import {
  DEFAULT_PAGE_SIZE,
  applyFilters,
  parseFilters,
  type FilterState,
} from '@/app/(site)/shared/catalog-filtering';
import {
  getCatalogListing,
  getCatalogListingPage,
  getCatalogTaxonomyOptions,
  resolveCatalogListingMetadata,
} from '@/app/(site)/shared/catalog';
import { Breadcrumbs } from '@/app/(site)/shared/ui/breadcrumbs';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, buildPath } from '@/lib/paths';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n';
import type { CatalogPageContent } from '@/lib/keystatic';
import { getCatalogTaxonomyValues } from '@/lib/catalog/constants';

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
  const taxonomyValues = getCatalogTaxonomyValues();
  const filters = parseFilters(rawSearchParams, taxonomyValues);
  const taxonomyOptions = getCatalogTaxonomyOptions(locale);
  const [items, shell, catalogPage] = await Promise.all([
    getCatalogListing(locale),
    getSiteShellData(locale),
    getCatalogListingPage(locale),
  ]);
  const filteredItems = applyFilters(items, filters, taxonomyValues);
  const pagination = resolvePagination(filteredItems.length, filters);
  const visibleItems = filteredItems.slice(0, pagination.visibleCount);
  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['catalog']);
  const currentPath = buildPath(locale, ['catalog']);
  const heading = resolveHeading(catalogPage, locale);
  const description = resolveDescription(catalogPage, locale);
  const submitLabel = resolveSubmitLabel(catalogPage, locale);
  const resetLabel = resolveResetLabel(catalogPage, locale);
  const detailLabel = resolveDetailLabel(catalogPage, locale);
  const requestLabel = resolveRequestLabel(catalogPage, locale);
  const emptyStateMessage = resolveEmptyState(catalogPage, locale);
  const groupLabels = resolveGroupLabels(catalogPage, locale);
  const homeLabel = locale === 'ru' ? 'Главная' : 'Home';

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
    >
      <main className="page-shell">
        <section className="container py-10 lg:py-12">
          <header className="mb-6 space-y-4 lg:mb-8">
            <Breadcrumbs
              items={[
                { label: homeLabel, href: buildPath(locale) },
                { label: heading },
              ]}
            />
            <SectionHeading title={heading} description={description} as="h1" />
          </header>

          <div className="flex gap-8 xl:gap-10">
            <aside className="hidden w-[280px] shrink-0 lg:block">
              <section className="rounded-lg border border-border bg-card p-6">
                <CatalogFilters
                  locale={locale}
                  state={filters}
                  groupLabels={groupLabels}
                  options={taxonomyOptions}
                  submitLabel={submitLabel}
                  resetLabel={resetLabel}
                />
              </section>
            </aside>

            <div className="flex flex-1 flex-col gap-4 lg:gap-6">
              <CatalogFiltersMobileTrigger
                locale={locale}
                state={filters}
                groupLabels={groupLabels}
                options={taxonomyOptions}
                submitLabel={submitLabel}
                resetLabel={resetLabel}
              />

              <ActiveFiltersChips state={filters} options={taxonomyOptions} />

              <CatalogToolbar state={filters} total={filteredItems.length} />

              <section>
                <CatalogList
                  items={visibleItems}
                  locale={locale}
                  taxonomyOptions={taxonomyOptions}
                  emptyStateMessage={emptyStateMessage}
                  detailLabel={detailLabel}
                  requestLabel={requestLabel}
                />

                {pagination.hasMore ? (
                  <LoadMoreForm
                    state={filters}
                    limit={pagination.limit}
                    nextOffset={pagination.nextOffset}
                    label={locale === 'ru' ? 'Загрузить ещё' : 'Load more'}
                  />
                ) : null}
              </section>
            </div>
          </div>
        </section>
      </main>
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

function resolveDetailLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.detailLabel ?? null, locale);
}

function resolveRequestLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.requestLabel ?? null, locale);
}

function resolveEmptyState(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.emptyStateMessage ?? null, locale);
}

function resolveGroupLabels(
  page: CatalogPageContent | null,
  locale: Locale
): CatalogFiltersProps['groupLabels'] {
  const defaults: CatalogFiltersProps['groupLabels'] = {
    category: 'Категория',
    process: 'Процесс',
    base: 'Основа',
    filler: 'Наполнитель',
    metal: 'Металл',
    auxiliary: 'Вспомогательные',
  };
  const groupLabels = page?.groupLabels ?? null;

  return {
    category: resolveLocalizedValue(groupLabels?.category ?? null, locale) || defaults.category,
    process: resolveLocalizedValue(groupLabels?.process ?? null, locale) || defaults.process,
    base: resolveLocalizedValue(groupLabels?.base ?? null, locale) || defaults.base,
    filler: resolveLocalizedValue(groupLabels?.filler ?? null, locale) || defaults.filler,
    metal: resolveLocalizedValue(groupLabels?.metal ?? null, locale) || defaults.metal,
    auxiliary:
      resolveLocalizedValue(groupLabels?.auxiliary ?? null, locale) || defaults.auxiliary,
  } satisfies CatalogFiltersProps['groupLabels'];
}

function resolvePagination(total: number, filters: FilterState) {
  const limit = Math.max(1, filters.limit || DEFAULT_PAGE_SIZE);
  const normalizedOffset = Math.max(0, filters.offset || 0);
  const clampedOffset = Math.min(normalizedOffset, Math.max(total - 1, 0));
  const visibleCount = Math.min(total, clampedOffset + limit);
  const hasMore = total > visibleCount;
  const nextOffset = hasMore ? visibleCount : clampedOffset;

  return { limit, visibleCount, hasMore, nextOffset };
}

function LoadMoreForm({
  state,
  limit,
  nextOffset,
  label,
}: {
  state: FilterState;
  limit: number;
  nextOffset: number;
  label: string;
}) {
  return (
    <div className="mt-6 flex justify-center">
      <form method="GET" className="flex flex-col items-center gap-2">
        <PersistedFiltersInputs state={state} />
        <input type="hidden" name="limit" value={String(limit)} />
        <input type="hidden" name="offset" value={String(nextOffset)} />
        <button type="submit" className="btn-outline">
          {label}
        </button>
      </form>
    </div>
  );
}

function PersistedFiltersInputs({ state }: { state: FilterState }) {
  const inputs: Array<{ name: string; value: string }> = [];

  for (const value of state.category.values) {
    inputs.push({ name: 'category', value });
  }

  const multiFilters: Array<{
    name: 'process' | 'base' | 'filler' | 'metal' | 'auxiliary';
    values: string[];
  }> = [
    { name: 'process', values: state.process.values },
    { name: 'base', values: state.base.values },
    { name: 'filler', values: state.filler.values },
    { name: 'metal', values: state.metal.values },
    { name: 'auxiliary', values: state.auxiliary.values },
  ];

  for (const entry of multiFilters) {
    for (const value of entry.values) {
      inputs.push({ name: entry.name as string, value });
    }
  }

  if (state.q) {
    inputs.push({ name: 'q', value: state.q });
  }

  if (state.sort && state.sort !== 'name') {
    inputs.push({ name: 'sort', value: state.sort });
  }

  return inputs.map((input, index) => (
    <input
      key={`${input.name}-${input.value}-${index}`}
      type="hidden"
      name={input.name}
      value={input.value}
    />
  ));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await Promise.resolve(params);
  if (!isLocale(rawLocale)) {
    return {};
  }
  return resolveCatalogListingMetadata(rawLocale);
}