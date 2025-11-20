import {
  AUXILIARY_CATEGORY,
  CATALOG_AUXILIARIES,
  CATALOG_BASES,
  CATALOG_CATEGORIES,
  CATALOG_FILLERS,
  CATALOG_PROCESSES,
  type CatalogAuxiliary,
  type CatalogBase,
  type CatalogCategory,
  type CatalogFiller,
  type CatalogProcess,
} from '@/lib/catalog/constants';

export type CatalogListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: CatalogCategory | null;
  process: CatalogProcess[];
  base: CatalogBase[];
  filler: CatalogFiller[];
  auxiliary: CatalogAuxiliary[];
  image: { src: string; width?: number | null; height?: number | null } | null;
  docs: string | null;
  updatedAt?: string | null;
};

export type MultiFilter<T extends string> = {
  values: T[];
  lookup: Set<T>;
};

export type FilterState = {
  category: CatalogCategory | null;
  process: MultiFilter<CatalogProcess>;
  base: MultiFilter<CatalogBase>;
  filler: MultiFilter<CatalogFiller>;
  auxiliary: MultiFilter<CatalogAuxiliary>;
};

export function parseFilters(params: Record<string, string | string[] | undefined>): FilterState {
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

export function applyFilters(items: CatalogListItem[], filters: FilterState): CatalogListItem[] {
  const shouldFilterAuxiliary = filters.auxiliary.values.length > 0 && filters.category === AUXILIARY_CATEGORY;
  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    if (filters.process.values.length > 0 && !hasIntersection(item.process, filters.process.lookup)) {
      return false;
    }
    if (filters.base.values.length > 0 && !hasIntersection(item.base, filters.base.lookup)) {
      return false;
    }
    if (filters.filler.values.length > 0 && !hasIntersection(item.filler, filters.filler.lookup)) {
      return false;
    }
    if (shouldFilterAuxiliary) {
      if (item.category !== AUXILIARY_CATEGORY) {
        return false;
      }
      if (!hasIntersection(item.auxiliary, filters.auxiliary.lookup)) {
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

function toMulti<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): MultiFilter<T> {
  const rawValues = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  const lookup = new Set<T>();
  for (const candidate of rawValues) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }
    if (!allowed.includes(trimmed as T)) {
      continue;
    }
    lookup.add(trimmed as T);
  }
  return { values: [...lookup], lookup } satisfies MultiFilter<T>;
}

function hasIntersection(values: string[], lookup: Set<string>): boolean {
  for (const value of values) {
    if (lookup.has(value)) {
      return true;
    }
  }
  return false;
}
