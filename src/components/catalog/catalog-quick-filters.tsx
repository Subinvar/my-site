import Link from 'next/link';

import type { CatalogFiltersProps } from './catalog-filters';
import { buildCatalogHref, serializeCatalogFilters, type CatalogView } from './catalog-url';
import {
  applyFilters,
  DEFAULT_PAGE_SIZE,
  type FilterState,
  type CatalogListItem,
} from '@/app/(site)/shared/catalog-filtering';
import type { CatalogTaxonomyValues } from '@/lib/catalog/constants';
import { cn } from '@/lib/cn';

export type CatalogQuickFiltersProps = {
  items: CatalogListItem[];
  state: FilterState;
  taxonomyOptions: CatalogFiltersProps['options'];
  taxonomyValues: CatalogTaxonomyValues;
  currentPath: string;
  view: CatalogView;
  labels: {
    categoryAll: string;
    processAll: string;
    categoryGroup: string;
    processGroup: string;
  };
};

export function CatalogQuickFilters({
  items,
  state,
  taxonomyOptions,
  taxonomyValues,
  currentPath,
  view,
  labels,
}: CatalogQuickFiltersProps) {
  const categories = buildCategoryPills({
    items,
    state,
    taxonomyOptions,
    taxonomyValues,
    currentPath,
    view,
    allLabel: labels.categoryAll,
  });

  const processes = buildProcessPills({
    items,
    state,
    taxonomyOptions,
    taxonomyValues,
    currentPath,
    view,
    allLabel: labels.processAll,
  });

  return (
    <div className="space-y-3">
      <FacetRow title={labels.categoryGroup} pills={categories} />
      <FacetRow title={labels.processGroup} pills={processes} />
    </div>
  );
}

type Pill = {
  key: string;
  label: string;
  count: number;
  selected: boolean;
  disabled: boolean;
  href: string;
};

function FacetRow({ title, pills }: { title: string; pills: Pill[] }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">{title}</div>
      <div
        className={cn(
          'flex items-center gap-2 overflow-x-auto pb-1',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'md:flex-wrap md:overflow-visible'
        )}
      >
        {pills.map((pill) => (
          <FacetPill key={pill.key} pill={pill} />
        ))}
      </div>
    </div>
  );
}

function FacetPill({ pill }: { pill: Pill }) {
  const content = (
    <>
      <span className="truncate">{pill.label}</span>
      <span className="text-xs tabular-nums text-muted-foreground">{pill.count}</span>
    </>
  );

  const className = cn(
    'inline-flex max-w-[240px] items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors',
    pill.selected
      ? 'border-[color:var(--color-brand-600)] bg-[color:color-mix(in srgb, var(--color-brand-600) 10%, var(--card))] text-foreground'
      : 'border-border bg-card text-foreground hover:border-[color:var(--color-brand-600)]',
    pill.disabled && !pill.selected ? 'pointer-events-none opacity-50' : null
  );

  if (pill.disabled && !pill.selected) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link href={pill.href} scroll={false} className={className}>
      {content}
    </Link>
  );
}

function toggleValue<T extends string>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function withPaginationReset(state: FilterState): FilterState {
  return { ...state, limit: DEFAULT_PAGE_SIZE, offset: 0 };
}

function buildCategoryPills({
  items,
  state,
  taxonomyOptions,
  taxonomyValues,
  currentPath,
  view,
  allLabel,
}: {
  items: CatalogListItem[];
  state: FilterState;
  taxonomyOptions: CatalogFiltersProps['options'];
  taxonomyValues: CatalogTaxonomyValues;
  currentPath: string;
  view: CatalogView;
  allLabel: string;
}): Pill[] {
  const pills: Pill[] = [];

  const clearedState: FilterState = withPaginationReset({
    ...state,
    category: { values: [], lookup: new Set() },
    auxiliary: { values: [], lookup: new Set() },
  });

  pills.push({
    key: 'category-all',
    label: allLabel,
    selected: state.category.values.length === 0,
    count: applyFilters(items, clearedState, taxonomyValues).length,
    disabled: false,
    href: buildCatalogHref(
      currentPath,
      serializeCatalogFilters({
        state: clearedState,
        view,
        auxiliaryCategory: taxonomyValues.auxiliaryCategory,
        includePagination: false,
      })
    ),
  });

  for (const option of taxonomyOptions.categories) {
    const nextValues = toggleValue(state.category.values, option.value);
    const nextCategory = { values: nextValues, lookup: new Set(nextValues) };

    const nextState: FilterState = withPaginationReset({
      ...state,
      category: nextCategory,
      auxiliary: nextCategory.lookup.has(taxonomyValues.auxiliaryCategory)
        ? state.auxiliary
        : { values: [], lookup: new Set() },
    });

    const count = applyFilters(items, nextState, taxonomyValues).length;
    const selected = state.category.lookup.has(option.value);

    pills.push({
      key: `category-${option.value}`,
      label: option.label,
      selected,
      count,
      disabled: count === 0,
      href: buildCatalogHref(
        currentPath,
        serializeCatalogFilters({
          state: nextState,
          view,
          auxiliaryCategory: taxonomyValues.auxiliaryCategory,
          includePagination: false,
        })
      ),
    });
  }

  return pills;
}

function buildProcessPills({
  items,
  state,
  taxonomyOptions,
  taxonomyValues,
  currentPath,
  view,
  allLabel,
}: {
  items: CatalogListItem[];
  state: FilterState;
  taxonomyOptions: CatalogFiltersProps['options'];
  taxonomyValues: CatalogTaxonomyValues;
  currentPath: string;
  view: CatalogView;
  allLabel: string;
}): Pill[] {
  const pills: Pill[] = [];

  const clearedState: FilterState = withPaginationReset({
    ...state,
    process: { values: [], lookup: new Set() },
  });

  pills.push({
    key: 'process-all',
    label: allLabel,
    selected: state.process.values.length === 0,
    count: applyFilters(items, clearedState, taxonomyValues).length,
    disabled: false,
    href: buildCatalogHref(
      currentPath,
      serializeCatalogFilters({
        state: clearedState,
        view,
        auxiliaryCategory: taxonomyValues.auxiliaryCategory,
        includePagination: false,
      })
    ),
  });

  for (const option of taxonomyOptions.processes) {
    const nextValues = toggleValue(state.process.values, option.value);
    const nextProcess = { values: nextValues, lookup: new Set(nextValues) };

    const nextState: FilterState = withPaginationReset({
      ...state,
      process: nextProcess,
    });

    const count = applyFilters(items, nextState, taxonomyValues).length;
    const selected = state.process.lookup.has(option.value);

    pills.push({
      key: `process-${option.value}`,
      label: option.label,
      selected,
      count,
      disabled: count === 0,
      href: buildCatalogHref(
        currentPath,
        serializeCatalogFilters({
          state: nextState,
          view,
          auxiliaryCategory: taxonomyValues.auxiliaryCategory,
          includePagination: false,
        })
      ),
    });
  }

  return pills;
}
