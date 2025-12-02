import type { CatalogTaxonomyValues } from '@/lib/catalog/constants';
import type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogFiller,
  CatalogMetal,
  CatalogProcess,
} from '@/lib/catalog/constants';

export const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 60;

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
  category: MultiFilter<CatalogCategory>;
  process: MultiFilter<CatalogProcess>;
  base: MultiFilter<CatalogBase>;
  filler: MultiFilter<CatalogFiller>;
  metal: MultiFilter<CatalogMetal>;
  auxiliary: MultiFilter<CatalogAuxiliary>;
  q: string | null;
  sort: 'name' | 'new';
  limit: number;
  offset: number;
};

export function parseFilters(
  params: Record<string, string | string[] | undefined>,
  taxonomy: CatalogTaxonomyValues
): FilterState {
  const { categories, processes, bases, fillers, metals, auxiliaries } = taxonomy;

  const query = toOptionalQuery(params.q);
  const sortValue = toSingle(params.sort);
  const sort: FilterState['sort'] = sortValue === 'new' ? 'new' : 'name';
  const limit = toLimit(params.limit);
  const offset = toOffset(params.offset);

  return {
    category: toMulti<CatalogCategory>(params.category, categories),
    process: toMulti<CatalogProcess>(params.process, processes),
    base: toMulti<CatalogBase>(params.base, bases),
    filler: toMulti<CatalogFiller>(params.filler, fillers),
    metal: toMulti<CatalogMetal>(params.metal, metals),
    auxiliary: toMulti<CatalogAuxiliary>(params.auxiliary, auxiliaries),
    q: query,
    sort,
    limit,
    offset,
  } satisfies FilterState;
}

export function applyFilters(
  items: CatalogListItem[],
  filters: FilterState,
  taxonomy: CatalogTaxonomyValues
): CatalogListItem[] {
  const shouldFilterAuxiliary =
    filters.auxiliary.values.length > 0 && filters.category.lookup.has(taxonomy.auxiliaryCategory);
  const normalizedQuery = filters.q?.toLowerCase() ?? null;

  const filtered = items.filter((item) => {
    if (filters.category.values.length > 0 && (!item.category || !filters.category.lookup.has(item.category))) {
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
    if (normalizedQuery) {
      const haystack = `${item.title} ${item.slug ?? ''}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });

  if (filters.sort === 'new') {
    return [...filtered].sort((a, b) => {
      const aDate = toTimestamp(a.updatedAt) ?? 0;
      const bDate = toTimestamp(b.updatedAt) ?? 0;
      if (aDate !== bDate) {
        return bDate - aDate;
      }
      return a.title.localeCompare(b.title);
    });
  }

  return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
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

function toOptionalQuery(value: string | string[] | undefined): string | null {
  const raw = toSingle(value);
  return raw ? raw.trim() || null : null;
}

function toLimit(value: string | string[] | undefined): number {
  const raw = toSingle(value);
  if (!raw) {
    return DEFAULT_PAGE_SIZE;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
}

function toOffset(value: string | string[] | undefined): number {
  const raw = toSingle(value);
  if (!raw) {
    return 0;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return parsed;
}

function toTimestamp(value?: string | null): number | null {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
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
