import Link from 'next/link';

import type { CatalogFiltersProps, CatalogFiltersState } from './catalog-filters';
import type { CatalogView } from './catalog-url';
import { cn } from '@/lib/cn';
import type { Locale } from '@/lib/i18n';

type FilterKey =
  | 'q'
  | 'sort'
  | 'category'
  | 'process'
  | 'base'
  | 'filler'
  | 'metal'
  | 'auxiliary';

type FilterChip = {
  name: FilterKey;
  value: string;
  label: string;
};

type ActiveFiltersChipsProps = {
  locale: Locale;
  state: CatalogFiltersState;
  options: CatalogFiltersProps['options'];
  view: CatalogView;
  auxiliaryCategory: string;
  resetHref: string;
  resetLabel: string;
};

const MAX_VISIBLE_CHIPS = 8;

export function ActiveFiltersChips({
  locale,
  state,
  options,
  view,
  auxiliaryCategory,
  resetHref,
  resetLabel,
}: ActiveFiltersChipsProps) {
  const labels = createLabelMaps(options);
  const chips = buildChips(state, labels, locale, auxiliaryCategory);

  if (!chips.length) return null;

  const visible = chips.slice(0, MAX_VISIBLE_CHIPS);
  const hidden = chips.slice(MAX_VISIBLE_CHIPS);
  const moreLabel = locale === 'ru' ? 'ещё' : 'more';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {visible.map((chip) => (
            <FilterChipForm
              key={`${chip.name}-${chip.value}`}
              chip={chip}
              state={state}
              view={view}
              auxiliaryCategory={auxiliaryCategory}
              locale={locale}
            />
          ))}

          {hidden.length ? (
            <details className="group">
              <summary
                className={cn(
                  'inline-flex cursor-pointer select-none items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm transition-colors',
                  'hover:bg-muted hover:text-foreground'
                )}
              >
                +{hidden.length} {moreLabel}
              </summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {hidden.map((chip) => (
                  <FilterChipForm
                    key={`${chip.name}-${chip.value}`}
                    chip={chip}
                    state={state}
                    view={view}
                    auxiliaryCategory={auxiliaryCategory}
                    locale={locale}
                  />
                ))}
              </div>
            </details>
          ) : null}
        </div>

        <Link
          href={resetHref}
          className={cn(
            'mt-1 inline-flex items-center text-sm text-muted-foreground transition-colors',
            'hover:text-foreground'
          )}
        >
          {resetLabel}
        </Link>
      </div>
    </div>
  );
}

function FilterChipForm({
  chip,
  state,
  view,
  auxiliaryCategory,
  locale,
}: {
  chip: FilterChip;
  state: CatalogFiltersState;
  view: CatalogView;
  auxiliaryCategory: string;
  locale: Locale;
}) {
  const removeLabel =
    locale === 'ru' ? `Удалить фильтр «${chip.label}»` : `Remove filter “${chip.label}”`;

  return (
    <form method="GET">
      <HiddenFilterFields state={state} skip={chip} view={view} auxiliaryCategory={auxiliaryCategory} />
      <button
        type="submit"
        className={cn(
          'inline-flex max-w-[260px] items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm text-foreground shadow-sm transition-colors',
          'hover:bg-muted/80'
        )}
      >
        <span className="truncate">{chip.label}</span>
        <span className="text-xs text-muted-foreground" aria-hidden>
          ✕
        </span>
        <span className="sr-only">{removeLabel}</span>
      </button>
    </form>
  );
}

function HiddenFilterFields({
  state,
  skip,
  view,
  auxiliaryCategory,
}: {
  state: CatalogFiltersState;
  skip: FilterChip;
  view: CatalogView;
  auxiliaryCategory: string;
}) {
  const inputs: { name: string; value: string }[] = [];

  const nextCategoryValues = state.category.values.filter((value) => {
    if (skip.name === 'category' && skip.value === value) {
      return false;
    }
    return true;
  });

  for (const value of nextCategoryValues) {
    inputs.push({ name: 'category', value });
  }

  const multiFilters: Array<{ name: Exclude<FilterKey, 'q' | 'sort' | 'category'>; values: string[] }> = [
    { name: 'process', values: state.process.values },
    { name: 'base', values: state.base.values },
    { name: 'filler', values: state.filler.values },
    { name: 'metal', values: state.metal.values },
  ];

  for (const entry of multiFilters) {
    for (const value of entry.values) {
      if (skip.name === entry.name && skip.value === value) {
        continue;
      }
      inputs.push({ name: entry.name, value });
    }
  }

  const canUseAuxiliary = nextCategoryValues.includes(auxiliaryCategory);
  if (canUseAuxiliary) {
    for (const value of state.auxiliary.values) {
      if (skip.name === 'auxiliary' && skip.value === value) {
        continue;
      }
      inputs.push({ name: 'auxiliary', value });
    }
  }

  if (view === 'list') {
    inputs.push({ name: 'view', value: 'list' });
  }

  if (state.q && skip.name !== 'q') {
    inputs.push({ name: 'q', value: state.q });
  }

  if (state.sort && state.sort !== 'name' && skip.name !== 'sort') {
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

function buildChips(
  state: CatalogFiltersState,
  labels: Record<Exclude<FilterKey, 'q' | 'sort'>, Map<string, string>>,
  locale: Locale,
  auxiliaryCategory: string
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (state.q) {
    chips.push({
      name: 'q',
      value: state.q,
      label: locale === 'ru' ? `Поиск: ${state.q}` : `Search: ${state.q}`,
    });
  }

  if (state.sort === 'new') {
    chips.push({
      name: 'sort',
      value: 'new',
      label: locale === 'ru' ? 'Сортировка: новые' : 'Sort: newest',
    });
  }

  addMultiFilterChips(chips, 'category', state.category.values, labels.category);
  addMultiFilterChips(chips, 'process', state.process.values, labels.process);
  addMultiFilterChips(chips, 'base', state.base.values, labels.base);
  addMultiFilterChips(chips, 'filler', state.filler.values, labels.filler);
  addMultiFilterChips(chips, 'metal', state.metal.values, labels.metal);

  if (state.category.lookup.has(auxiliaryCategory)) {
    addMultiFilterChips(chips, 'auxiliary', state.auxiliary.values, labels.auxiliary);
  }

  return chips;
}

function addMultiFilterChips(
  target: FilterChip[],
  name: Exclude<FilterKey, 'q' | 'sort'>,
  values: string[],
  labels: Map<string, string>
) {
  for (const value of values) {
    target.push({ name, value, label: labels.get(value) ?? value });
  }
}

function createLabelMaps(
  options: CatalogFiltersProps['options']
): Record<Exclude<FilterKey, 'q' | 'sort'>, Map<string, string>> {
  return {
    category: new Map(options.categories.map((option) => [option.value, option.label])),
    process: new Map(options.processes.map((option) => [option.value, option.label])),
    base: new Map(options.bases.map((option) => [option.value, option.label])),
    filler: new Map(options.fillers.map((option) => [option.value, option.label])),
    metal: new Map(options.metals.map((option) => [option.value, option.label])),
    auxiliary: new Map(options.auxiliaries.map((option) => [option.value, option.label])),
  };
}
