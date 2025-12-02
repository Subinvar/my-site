import type { CatalogFiltersProps, CatalogFiltersState } from './catalog-filters';

type FilterKey = 'category' | 'process' | 'base' | 'filler' | 'metal' | 'auxiliary';

type FilterChip = {
  name: FilterKey;
  value: string;
  label: string;
};

type ActiveFiltersChipsProps = {
  state: CatalogFiltersState;
  options: CatalogFiltersProps['options'];
};

export function ActiveFiltersChips({ state, options }: ActiveFiltersChipsProps) {
  const labels = createLabelMaps(options);
  const chips = buildChips(state, labels);

  if (!chips.length) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <form key={`${chip.name}-${chip.value}`} method="GET">
          <HiddenFilterFields state={state} skip={chip} />
          <button type="submit" className="chip chip-filled">
            {chip.label}
            <span className="ml-1 text-xs" aria-hidden>
              ✕
            </span>
            <span className="sr-only">Удалить фильтр {chip.label}</span>
          </button>
        </form>
      ))}
    </div>
  );
}

function HiddenFilterFields({ state, skip }: { state: CatalogFiltersState; skip: FilterChip }) {
  const inputs: { name: string; value: string }[] = [];

  for (const value of state.category.values) {
    if (skip.name === 'category' && skip.value === value) {
      continue;
    }
    inputs.push({ name: 'category', value });
  }

  const multiFilters: Array<{ name: Exclude<FilterKey, 'category'>; values: string[] }> = [
    { name: 'process', values: state.process.values },
    { name: 'base', values: state.base.values },
    { name: 'filler', values: state.filler.values },
    { name: 'metal', values: state.metal.values },
    { name: 'auxiliary', values: state.auxiliary.values },
  ];

  for (const entry of multiFilters) {
    for (const value of entry.values) {
      if (skip.name === entry.name && skip.value === value) {
        continue;
      }
      inputs.push({ name: entry.name, value });
    }
  }

  if (state.q) {
    inputs.push({ name: 'q', value: state.q });
  }

  if (state.sort && state.sort !== 'name') {
    inputs.push({ name: 'sort', value: state.sort });
  }

  return inputs.map((input, index) => (
    <input key={`${input.name}-${input.value}-${index}`} type="hidden" name={input.name} value={input.value} />
  ));
}

function buildChips(state: CatalogFiltersState, labels: Record<FilterKey, Map<string, string>>): FilterChip[] {
  const chips: FilterChip[] = [];

  addMultiFilterChips(chips, 'category', state.category.values, labels.category);

  addMultiFilterChips(chips, 'process', state.process.values, labels.process);
  addMultiFilterChips(chips, 'base', state.base.values, labels.base);
  addMultiFilterChips(chips, 'filler', state.filler.values, labels.filler);
  addMultiFilterChips(chips, 'metal', state.metal.values, labels.metal);
  addMultiFilterChips(chips, 'auxiliary', state.auxiliary.values, labels.auxiliary);

  return chips;
}

function addMultiFilterChips(
  target: FilterChip[],
  name: FilterKey,
  values: string[],
  labels: Map<string, string>
) {
  for (const value of values) {
    target.push({ name, value, label: labels.get(value) ?? value });
  }
}

function createLabelMaps(options: CatalogFiltersProps['options']): Record<FilterKey, Map<string, string>> {
  return {
    category: new Map(options.categories.map((option) => [option.value, option.label])),
    process: new Map(options.processes.map((option) => [option.value, option.label])),
    base: new Map(options.bases.map((option) => [option.value, option.label])),
    filler: new Map(options.fillers.map((option) => [option.value, option.label])),
    metal: new Map(options.metals.map((option) => [option.value, option.label])),
    auxiliary: new Map(options.auxiliaries.map((option) => [option.value, option.label])),
  } satisfies Record<FilterKey, Map<string, string>>;
}
