'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { applyFilters, parseFilters, type FilterState } from './catalog-filtering';
import { buildPath } from '@/lib/paths';
import { CatalogItemCard, type AttributeLabels, type CatalogValueLabels } from './ui/catalog-item-card';
import type { CatalogTaxonomyOptions } from './filter-controls';
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
};

export function CatalogListing({
  items,
  initialFilters,
  emptyStateMessage,
  detailLabel,
  locale,
  taxonomy,
  taxonomyOptions,
}: CatalogListingProps) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => {
    if (!searchParams) {
      return initialFilters;
    }
    return parseFilters(toRecord(searchParams), taxonomy);
  }, [initialFilters, searchParams, taxonomy]);

  const filteredItems = useMemo(() => applyFilters(items, filters, taxonomy), [items, filters, taxonomy]);
  const attributeLabels = ATTRIBUTE_LABELS[locale];
  const valueLabels = useMemo(() => createValueLabels(taxonomyOptions), [taxonomyOptions]);

  if (filteredItems.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
        {emptyStateMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
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
