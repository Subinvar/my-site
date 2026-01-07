import { DEFAULT_PAGE_SIZE, type FilterState } from '@/app/(site)/shared/catalog-filtering';

export type CatalogView = 'grid' | 'list';

export function parseCatalogView(
  params: Record<string, string | string[] | undefined>
): CatalogView {
  const raw = params.view;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'list' ? 'list' : 'grid';
}

export function serializeCatalogFilters({
  state,
  view = 'grid',
  auxiliaryCategory,
  includePagination = false,
}: {
  state: FilterState;
  view?: CatalogView;
  auxiliaryCategory: string;
  includePagination?: boolean;
}): URLSearchParams {
  const params = new URLSearchParams();

  for (const value of state.category.values) {
    params.append('category', value);
  }

  for (const value of state.process.values) {
    params.append('process', value);
  }

  for (const value of state.base.values) {
    params.append('base', value);
  }

  for (const value of state.filler.values) {
    params.append('filler', value);
  }

  for (const value of state.metal.values) {
    params.append('metal', value);
  }

  const canUseAuxiliary = state.category.lookup.has(auxiliaryCategory);
  if (canUseAuxiliary) {
    for (const value of state.auxiliary.values) {
      params.append('auxiliary', value);
    }
  }

  if (state.q) {
    params.set('q', state.q);
  }

  if (state.sort && state.sort !== 'name') {
    params.set('sort', state.sort);
  }

  if (view === 'list') {
    params.set('view', 'list');
  }

  if (includePagination) {
    if (state.offset && state.offset > 0) {
      params.set('offset', String(state.offset));
    }

    // Keep URLs tidy: omit the default page size.
    if (state.limit && state.limit !== DEFAULT_PAGE_SIZE) {
      params.set('limit', String(state.limit));
    }
  }

  return params;
}

export function buildCatalogHref(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
