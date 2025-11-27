import type { CatalogTaxonomyValues } from '@/lib/catalog/constants';
import type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogFiller,
  CatalogMetal,
  CatalogProcess,
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
  metals: CatalogMetal[];
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
  metal: MultiFilter<CatalogMetal>;
  auxiliary: MultiFilter<CatalogAuxiliary>;
};

export function parseFilters(
  params: Record<string, string | string[] | undefined>,
  taxonomy: CatalogTaxonomyValues
): FilterState {
  const { categories, processes, bases, fillers, metals, auxiliaries } = taxonomy;
  const categoryValue = toSingle(params.category);
  const category = categoryValue && categories.includes(categoryValue as CatalogCategory)
    ? (categoryValue as CatalogCategory)
    : null;

  return {
    category,
    process: toMulti<CatalogProcess>(params.process, processes),
    base: toMulti<CatalogBase>(params.base, bases),
    filler: toMulti<CatalogFiller>(params.filler, fillers),
    metal: toMulti<CatalogMetal>(params.metal, metals),
    auxiliary: toMulti<CatalogAuxiliary>(params.auxiliary, auxiliaries),
  } satisfies FilterState;
}

export function applyFilters(
  items: CatalogListItem[],
  filters: FilterState,
  taxonomy: CatalogTaxonomyValues
): CatalogListItem[] {
  const shouldFilterAuxiliary =
    filters.auxiliary.values.length > 0 && filters.category === taxonomy.auxiliaryCategory;
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
    if (filters.metal.values.length > 0 && !hasIntersection(item.metals, filters.metal.lookup)) {
      return false;
    }
    if (shouldFilterAuxiliary) {
      if (item.category !== taxonomy.auxiliaryCategory) {
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
