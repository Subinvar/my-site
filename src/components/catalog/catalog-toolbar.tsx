import Link from 'next/link';

import type { CatalogFiltersState } from './catalog-filters';
import { buildCatalogHref, serializeCatalogFilters, type CatalogView } from './catalog-url';
import { Button } from '@/app/(site)/shared/ui/button';
import { Input } from '@/app/(site)/shared/ui/input';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/cn';

export type CatalogToolbarProps = {
  locale: Locale;
  state: CatalogFiltersState;
  total: number;
  view: CatalogView;
  currentPath: string;
  auxiliaryCategory: string;
  searchPlaceholder: string;
};

export function CatalogToolbar({
  locale,
  state,
  total,
  view,
  currentPath,
  auxiliaryCategory,
  searchPlaceholder,
}: CatalogToolbarProps) {
  const resultsLabel =
    locale === 'ru' ? `Найдено ${total} позиций` : `${total} items found`;

  const gridHref = buildCatalogHref(
    currentPath,
    serializeCatalogFilters({
      state,
      view: 'grid',
      auxiliaryCategory,
      includePagination: true,
    })
  );

  const listHref = buildCatalogHref(
    currentPath,
    serializeCatalogFilters({
      state,
      view: 'list',
      auxiliaryCategory,
      includePagination: true,
    })
  );

  const sortLabel = locale === 'ru' ? 'Сортировка' : 'Sort';
  const sortNameLabel = locale === 'ru' ? 'По алфавиту' : 'A–Z';
  const sortNewLabel = locale === 'ru' ? 'Сначала новые' : 'Newest';
  const applyLabel = locale === 'ru' ? 'Применить' : 'Apply';

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">{resultsLabel}</div>
        <ViewToggle
          locale={locale}
          view={view}
          gridHref={gridHref}
          listHref={listHref}
        />
      </div>

      <form method="GET" className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <PersistedFiltersFields state={state} auxiliaryCategory={auxiliaryCategory} />
        {view === 'list' ? <input type="hidden" name="view" value="list" /> : null}

        <Input
          type="search"
          name="q"
          defaultValue={state.q ?? ''}
          placeholder={searchPlaceholder}
          className="sm:w-[320px] lg:w-[360px]"
        />

        <label className="sr-only" htmlFor="catalog-sort">
          {sortLabel}
        </label>
        <select
          id="catalog-sort"
          name="sort"
          defaultValue={state.sort ?? 'name'}
          className={cn(
            'h-10 w-full rounded-lg border border-border bg-[var(--input)] px-3 py-2 text-sm text-foreground shadow-sm outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'sm:w-[180px]'
          )}
        >
          <option value="name">{sortNameLabel}</option>
          <option value="new">{sortNewLabel}</option>
        </select>

        <Button type="submit" variant="secondary" className="sm:min-w-[132px]">
          {applyLabel}
        </Button>
      </form>
    </div>
  );
}

function PersistedFiltersFields({
  state,
  auxiliaryCategory,
}: {
  state: CatalogFiltersState;
  auxiliaryCategory: string;
}) {
  const inputs: Array<{ name: string; value: string }> = [];

  for (const value of state.category.values) {
    inputs.push({ name: 'category', value });
  }

  const multiFilters: Array<{ name: string; values: string[] }> = [
    { name: 'process', values: state.process.values },
    { name: 'base', values: state.base.values },
    { name: 'filler', values: state.filler.values },
    { name: 'metal', values: state.metal.values },
  ];

  for (const entry of multiFilters) {
    for (const value of entry.values) {
      inputs.push({ name: entry.name, value });
    }
  }

  const canUseAuxiliary = state.category.lookup.has(auxiliaryCategory);
  if (canUseAuxiliary) {
    for (const value of state.auxiliary.values) {
      inputs.push({ name: 'auxiliary', value });
    }
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

function ViewToggle({
  locale,
  view,
  gridHref,
  listHref,
}: {
  locale: Locale;
  view: CatalogView;
  gridHref: string;
  listHref: string;
}) {
  const gridLabel = locale === 'ru' ? 'Карточки' : 'Cards';
  const listLabel = locale === 'ru' ? 'Список' : 'List';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-card p-1 text-xs',
        'shadow-sm'
      )}
      aria-label={locale === 'ru' ? 'Вид каталога' : 'Catalog view'}
    >
      <Link
        href={gridHref}
        scroll={false}
        className={cn(
          'rounded-md px-2.5 py-1.5 font-medium transition-colors',
          view === 'grid'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        {gridLabel}
      </Link>
      <Link
        href={listHref}
        scroll={false}
        className={cn(
          'rounded-md px-2.5 py-1.5 font-medium transition-colors',
          view === 'list'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        {listLabel}
      </Link>
    </div>
  );
}
