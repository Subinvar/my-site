'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { applyFilters, parseFilters, type FilterState } from './catalog-filtering';
import { buildPath } from '@/lib/paths';
import { CatalogItemCard, type AttributeLabels, type CatalogValueLabels } from './ui/catalog-item-card';
import { Tag } from './ui/tag';
import type { CatalogGroupLabels, CatalogTaxonomyOptions } from './filter-controls';
import type { CatalogTaxonomyValues } from '@/lib/catalog/constants';
import type { CatalogListItem } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';

const ATTRIBUTE_LABELS: Record<Locale, AttributeLabels> = {
  ru: {
    category: 'Категория',
    process: 'Процесс',
    base: 'Основа',
    filler: 'Наполнитель',
    auxiliary: 'Вспомогательные',
    metal: 'Металл',
  },
  en: {
    category: 'Category',
    process: 'Process',
    base: 'Base',
    filler: 'Filler',
    auxiliary: 'Auxiliary supplies',
    metal: 'Metal',
  },
};

function toRecord(params: URLSearchParams): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  params.forEach((value, key) => {
    const current = record[key];
    if (Array.isArray(current)) {
      record[key] = [...current, value];
    } else if (typeof current === 'string') {
      record[key] = [current, value];
    } else {
      record[key] = value;
    }
  });
  return record;
}

type CatalogListingProps = {
  items: CatalogListItem[];
  initialFilters: FilterState;
  emptyStateMessage: string;
  detailLabel: string;
  locale: Locale;
  taxonomy: CatalogTaxonomyValues;
  taxonomyOptions: CatalogTaxonomyOptions;
  groupLabels: CatalogGroupLabels;
};

export function CatalogListing({
  items,
  initialFilters,
  emptyStateMessage,
  detailLabel,
  locale,
  taxonomy,
  taxonomyOptions,
  groupLabels,
}: CatalogListingProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const filters = useMemo(() => {
    if (!searchParams) {
      return initialFilters;
    }
    return parseFilters(toRecord(searchParams), taxonomy);
  }, [initialFilters, searchParams, taxonomy]);

  const filteredItems = useMemo(() => applyFilters(items, filters, taxonomy), [items, filters, taxonomy]);
  const attributeLabels = ATTRIBUTE_LABELS[locale];
  const valueLabels = useMemo(() => createValueLabels(taxonomyOptions), [taxonomyOptions]);
  const activeFilters = useMemo(() => buildActiveFilters(filters, valueLabels), [filters, valueLabels]);
  const removeLabel = locale === 'ru' ? 'Удалить фильтр' : 'Remove filter';

  const handleRemoveFilter = useCallback(
    (filter: ActiveFilter) => {
      if (!searchParams) {
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      if (filter.key === 'category') {
        params.delete('category');
      } else {
        const key = filter.key;
        const nextValues = params.getAll(key).filter((value) => value !== filter.value);
        params.delete(key);
        for (const value of nextValues) {
          params.append(key, value);
        }
      }
      const query = params.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;
      router.replace(nextUrl, { scroll: false });
      router.refresh();
    },
    [pathname, router, searchParams]
  );

  if (filteredItems.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
        {emptyStateMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-live="polite">
          {activeFilters.map((filter) => (
            <Tag key={`${filter.key}:${filter.value}`} active onClick={() => handleRemoveFilter(filter)}>
              <span>
                {groupLabels[filter.key]}: {filter.label}
              </span>
              <span aria-hidden="true">×</span>
              <span className="sr-only">{`${removeLabel} ${groupLabels[filter.key]}: ${filter.label}`}</span>
            </Tag>
          ))}
        </div>
      ) : null}

      <ul className="grid gap-8 md:grid-cols-2">
        {filteredItems.map((item) => (
          <li key={`${item.id}:${item.slug}`}>
            <CatalogItemCard
              item={item}
              detailHref={buildPath(locale, ['catalog', item.slug])}
              detailLabel={detailLabel}
              attributeLabels={attributeLabels}
              valueLabels={valueLabels}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

type ActiveFilterKey = keyof Pick<FilterState, 'category' | 'process' | 'base' | 'filler' | 'metal' | 'auxiliary'>;

type ActiveFilter = {
  key: ActiveFilterKey;
  value: string;
  label: string;
};

function buildActiveFilters(filters: FilterState, labels: CatalogValueLabels): ActiveFilter[] {
  const result: ActiveFilter[] = [];

  if (filters.category) {
    result.push({ key: 'category', value: filters.category, label: labels.category.get(filters.category) ?? filters.category });
  }

  addMultiFilter(result, 'process', filters.process.values, labels.process);
  addMultiFilter(result, 'base', filters.base.values, labels.base);
  addMultiFilter(result, 'filler', filters.filler.values, labels.filler);
  addMultiFilter(result, 'metal', filters.metal.values, labels.metal);
  addMultiFilter(result, 'auxiliary', filters.auxiliary.values, labels.auxiliary);

  return result;
}

function addMultiFilter(
  target: ActiveFilter[],
  key: Exclude<ActiveFilterKey, 'category'>,
  values: string[],
  labels: Map<string, string>
) {
  for (const value of values) {
    target.push({ key, value, label: labels.get(value) ?? value });
  }
}

function createValueLabels(options: CatalogTaxonomyOptions): CatalogValueLabels {
  return {
    category: new Map(options.categories.map((entry) => [entry.value, entry.label])),
    process: new Map(options.processes.map((entry) => [entry.value, entry.label])),
    base: new Map(options.bases.map((entry) => [entry.value, entry.label])),
    filler: new Map(options.fillers.map((entry) => [entry.value, entry.label])),
    metal: new Map(options.metals.map((entry) => [entry.value, entry.label])),
    auxiliary: new Map(options.auxiliaries.map((entry) => [entry.value, entry.label])),
  } satisfies CatalogValueLabels;
}
