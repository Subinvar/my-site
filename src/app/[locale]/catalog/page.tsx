import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  CatalogFilters,
  CatalogFiltersMobileTrigger,
} from '@/components/catalog/catalog-filters';
import { ActiveFiltersChips } from '@/components/catalog/active-filters-chips';
import { CatalogQuickFilters } from '@/components/catalog/catalog-quick-filters';
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar';
import { CatalogList } from '@/components/catalog/catalog-list';
import { parseCatalogView, type CatalogView } from '@/components/catalog/catalog-url';
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
import {
  resolveCategoryAllLabel,
  resolveDescription,
  resolveDetailLabel,
  resolveEmptyState,
  resolveGroupLabels,
  resolveHeading,
  resolveLoadMoreLabel,
  resolveProcessAllLabel,
  resolveRequestLabel,
  resolveResetLabel,
  resolveSearchPlaceholder,
  resolveSubmitLabel,
} from '@/app/(site)/shared/catalog-page-messages';
import { Button } from '@/app/(site)/shared/ui/button';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { getCatalogTaxonomyValues } from '@/lib/catalog/constants';
import { isLocale, type Locale } from '@/lib/i18n';
import { buildPath, findTargetLocale } from '@/lib/paths';

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
  const view = parseCatalogView(rawSearchParams);
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
  const resetHref = buildResetHref(currentPath, view);

  const heading = resolveHeading(catalogPage, locale);
  const description = resolveDescription(catalogPage, locale);
  const searchPlaceholder = resolveSearchPlaceholder(catalogPage, locale);
  const submitLabel = resolveSubmitLabel(catalogPage, locale);
  const resetLabel = resolveResetLabel(catalogPage, locale);
  const detailLabel = resolveDetailLabel(catalogPage, locale);
  const requestLabel = resolveRequestLabel(catalogPage, locale);
  const emptyStateMessage = resolveEmptyState(catalogPage, locale);
  const groupLabels = resolveGroupLabels(catalogPage, locale);
  const categoryAllLabel = resolveCategoryAllLabel(catalogPage, locale);
  const processAllLabel = resolveProcessAllLabel(catalogPage, locale);
  const loadMoreLabel = resolveLoadMoreLabel(catalogPage, locale);
  const categoryGroupLabel = groupLabels.category ?? (locale === 'ru' ? 'Категория' : 'Category');
  const processGroupLabel = groupLabels.process ?? (locale === 'ru' ? 'Процесс' : 'Process');

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
        <section className="container py-10 lg:py-12">
          <header className="mb-6 space-y-4 lg:mb-8">
            <SectionHeading title={heading} description={description} as="h1" />
          </header>

          <div
            className="grid gap-8 xl:gap-10 lg:grid-cols-[280px,1fr]"
            suppressHydrationWarning
          >
            <aside className="hidden lg:block self-start">
              <section className="w-[280px] shrink-0 rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-[calc(var(--header-height)+1.25rem)]">
                <CatalogFilters
                  locale={locale}
                  view={view}
                  auxiliaryCategory={taxonomyValues.auxiliaryCategory}
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
                view={view}
                auxiliaryCategory={taxonomyValues.auxiliaryCategory}
                state={filters}
                groupLabels={groupLabels}
                options={taxonomyOptions}
                submitLabel={submitLabel}
                resetLabel={resetLabel}
              />

              <CatalogQuickFilters
                items={items}
                state={filters}
                taxonomyOptions={taxonomyOptions}
                taxonomyValues={taxonomyValues}
                view={view}
                currentPath={currentPath}
                labels={{
                  categoryAll: categoryAllLabel,
                  processAll: processAllLabel,
                  categoryGroup: categoryGroupLabel,
                  processGroup: processGroupLabel,
                }}
              />

              <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur lg:sticky lg:top-[calc(var(--header-height)+1.25rem)] z-10">
                <div className="space-y-3">
                  <ActiveFiltersChips
                    locale={locale}
                    state={filters}
                    options={taxonomyOptions}
                    view={view}
                    auxiliaryCategory={taxonomyValues.auxiliaryCategory}
                    resetHref={resetHref}
                    resetLabel={resetLabel}
                  />

                  <CatalogToolbar
                    locale={locale}
                    state={filters}
                    total={filteredItems.length}
                    view={view}
                    currentPath={currentPath}
                    auxiliaryCategory={taxonomyValues.auxiliaryCategory}
                    searchPlaceholder={searchPlaceholder}
                  />
                </div>
              </section>

              {filteredItems.length === 0 ? (
                <section className="rounded-2xl border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">{emptyStateMessage}</p>
                  <div className="mt-4 flex justify-center">
                    <Button variant="secondary" asChild>
                      <Link href={resetHref}>{resetLabel}</Link>
                    </Button>
                  </div>
                </section>
              ) : (
                <section>
                  <CatalogList
                    items={visibleItems}
                    locale={locale}
                    options={taxonomyOptions}
                    auxiliaryCategory={taxonomyValues.auxiliaryCategory}
                    detailLabel={detailLabel}
                    requestLabel={requestLabel}
                    view={view}
                  />

                  {pagination.hasMore ? (
                    <LoadMoreForm
                      state={filters}
                      view={view}
                      auxiliaryCategory={taxonomyValues.auxiliaryCategory}
                      limit={pagination.limit}
                      nextOffset={pagination.nextOffset}
                      label={loadMoreLabel}
                    />
                  ) : null}
                </section>
              )}
            </div>
          </div>
        </section>
      </main>
    </SiteShellLayout>
  );
}

function buildResetHref(currentPath: string, view: CatalogView) {
  if (view !== 'list') {
    return currentPath;
  }
  const params = new URLSearchParams();
  params.set('view', 'list');
  return `${currentPath}?${params.toString()}`;
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
  view,
  auxiliaryCategory,
  limit,
  nextOffset,
  label,
}: {
  state: FilterState;
  view: CatalogView;
  auxiliaryCategory: string;
  limit: number;
  nextOffset: number;
  label: string;
}) {
  return (
    <div className="mt-8 flex justify-center">
      <form method="GET" className="flex flex-col items-center gap-2">
        <PersistedFiltersInputs
          state={state}
          view={view}
          auxiliaryCategory={auxiliaryCategory}
        />
        <input type="hidden" name="limit" value={String(limit)} />
        <input type="hidden" name="offset" value={String(nextOffset)} />
        <Button type="submit" variant="secondary">
          {label}
        </Button>
      </form>
    </div>
  );
}

function PersistedFiltersInputs({
  state,
  view,
  auxiliaryCategory,
}: {
  state: FilterState;
  view: CatalogView;
  auxiliaryCategory: string;
}) {
  const inputs: Array<{ name: string; value: string }> = [];

  for (const value of state.category.values) {
    inputs.push({ name: 'category', value });
  }

  const multiFilters: Array<{
    name: 'process' | 'base' | 'filler' | 'metal';
    values: string[];
  }> = [
    { name: 'process', values: state.process.values },
    { name: 'base', values: state.base.values },
    { name: 'filler', values: state.filler.values },
    { name: 'metal', values: state.metal.values },
  ];

  for (const entry of multiFilters) {
    for (const value of entry.values) {
      inputs.push({ name: entry.name as string, value });
    }
  }

  if (state.category.lookup.has(auxiliaryCategory)) {
    for (const value of state.auxiliary.values) {
      inputs.push({ name: 'auxiliary', value });
    }
  }

  if (state.q) {
    inputs.push({ name: 'q', value: state.q });
  }

  if (state.sort && state.sort !== 'name') {
    inputs.push({ name: 'sort', value: state.sort });
  }

  if (view === 'list') {
    inputs.push({ name: 'view', value: 'list' });
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
