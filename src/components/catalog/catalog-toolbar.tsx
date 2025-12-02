import type { CatalogFiltersState } from './catalog-filters';

export function CatalogToolbar({ state, total }: { state: CatalogFiltersState; total: number }) {
  return (
    <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">Найдено {total} позиций</div>

      <form method="GET" className="flex flex-1 justify-end gap-2">
        <PersistedFiltersFields state={state} />
        <input
          type="search"
          name="q"
          defaultValue={state.q ?? ''}
          placeholder="Поиск по названию или артикулу"
          className="input flex-1 max-w-xs"
        />
        <select name="sort" defaultValue={state.sort ?? 'name'} className="select w-[180px]">
          <option value="name">По алфавиту</option>
          <option value="new">По новизне</option>
        </select>
        <button type="submit" className="btn-outline">
          Применить
        </button>
      </form>
    </div>
  );
}

function PersistedFiltersFields({ state }: { state: CatalogFiltersState }) {
  const inputs: Array<{ name: string; value: string }> = [];

  for (const value of state.category.values) {
    inputs.push({ name: 'category', value });
  }

  const multiFilters: Array<{ name: string; values: string[] }> = [
    { name: 'process', values: state.process.values },
    { name: 'base', values: state.base.values },
    { name: 'filler', values: state.filler.values },
    { name: 'metal', values: state.metal.values },
    { name: 'auxiliary', values: state.auxiliary.values },
  ];

  for (const entry of multiFilters) {
    for (const value of entry.values) {
      inputs.push({ name: entry.name, value });
    }
  }

  return inputs.map((input, index) => (
    <input key={`${input.name}-${input.value}-${index}`} type="hidden" name={input.name} value={input.value} />
  ));
}
