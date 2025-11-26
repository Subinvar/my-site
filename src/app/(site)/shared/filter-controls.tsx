'use client';

import { useCallback, useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogFiller,
  CatalogProcess,
  DocumentLanguage,
  DocumentType,
} from '@/lib/keystatic';

type CatalogTaxonomyOptions = {
  categories: ReadonlyArray<{ value: CatalogCategory; label: string }>;
  processes: ReadonlyArray<{ value: CatalogProcess; label: string }>;
  bases: ReadonlyArray<{ value: CatalogBase; label: string }>;
  fillers: ReadonlyArray<{ value: CatalogFiller; label: string }>;
  auxiliaries: ReadonlyArray<{ value: CatalogAuxiliary; label: string }>;
};

type CatalogGroupLabels = {
  category: string;
  process: string;
  base: string;
  filler: string;
  auxiliary: string;
};

export type CatalogFilterValues = {
  category: CatalogCategory | null;
  process: CatalogProcess[];
  base: CatalogBase[];
  filler: CatalogFiller[];
  auxiliary: CatalogAuxiliary[];
};

type CatalogFiltersProps = {
  taxonomyOptions: CatalogTaxonomyOptions;
  groupLabels: CatalogGroupLabels;
  categoryAllLabel: string;
  submitLabel: string;
  resetLabel: string;
  initialValues: CatalogFilterValues;
};

export function CatalogFilters({
  taxonomyOptions,
  groupLabels,
  categoryAllLabel,
  submitLabel,
  resetLabel,
  initialValues,
}: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState(initialValues);
  const [isPending, startTransition] = useTransition();

  const syncQuery = useCallback(
    (nextState: CatalogFilterValues, options?: { navigate?: boolean }) => {
      const shouldNavigate = options?.navigate !== false;
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        updateCategoryParam(params, nextState.category);
        setMultiParam(params, 'process', nextState.process);
        setMultiParam(params, 'base', nextState.base);
        setMultiParam(params, 'filler', nextState.filler);
        setMultiParam(params, 'auxiliary', nextState.auxiliary);
        const query = params.toString();
        const nextUrl = query ? `${pathname}?${query}` : pathname;

        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', nextUrl);
        }

        if (shouldNavigate) {
          router.replace(nextUrl, { scroll: false });
          router.refresh();
        }
      });
    },
    [pathname, router, searchParams]
  );

  const updateState = useCallback(
    (updater: (prev: CatalogFilterValues) => CatalogFilterValues) => {
      let nextState: CatalogFilterValues | null = null;
      setState((prev) => {
        const next = updater(prev);
        if (next === prev) {
          return prev;
        }
        nextState = next;
        return next;
      });

      if (nextState) {
        syncQuery(nextState, { navigate: false });
      }
    },
    [syncQuery]
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      syncQuery(state);
    },
    [state, syncQuery]
  );

  const handleReset = useCallback(() => {
    const cleared = createEmptyCatalogFilters();
    setState(cleared);
    syncQuery(cleared);
  }, [syncQuery]);

  const renderCategoryOption = (value: CatalogCategory | null, label: string) => {
    const id = value ? `category-${value}` : 'category-all';
    return (
      <label key={id} className="flex items-center gap-2 text-sm text-zinc-700" htmlFor={id}>
        <input
          id={id}
          type="radio"
          name="category"
          value={value ?? ''}
          checked={state.category === value}
          onChange={() =>
            updateState((prev) => (prev.category === value ? prev : { ...prev, category: value }))
          }
          className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
        />
        {label}
      </label>
    );
  };

  const renderCheckboxGroup = <T extends string>(
    name: keyof Omit<CatalogFilterValues, 'category'>,
    options: ReadonlyArray<{ value: T; label: string }>,
    selected: T[]
  ) => {
    return options.map((option) => {
      const id = `${name}-${encodeURIComponent(option.value).replace(/%/g, '').toLowerCase() || 'option'}`;
      return (
        <label key={option.value} className="flex items-center gap-2 text-sm text-zinc-700" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            name={name}
            value={option.value}
            checked={selected.includes(option.value)}
            data-testid="catalog-filter-checkbox"
            onChange={(event) =>
              updateState((prev) => {
                const nextValues = toggleValue(prev[name] as T[], option.value, event.target.checked);
                if (nextValues === prev[name]) {
                  return prev;
                }
                return { ...prev, [name]: nextValues } as CatalogFilterValues;
              })
            }
            className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          {option.label}
        </label>
      );
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} aria-busy={isPending}>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {groupLabels.category}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCategoryOption(null, categoryAllLabel)}
          {taxonomyOptions.categories.map((option) => renderCategoryOption(option.value, option.label))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {groupLabels.process}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCheckboxGroup('process', taxonomyOptions.processes, state.process)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {groupLabels.base}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCheckboxGroup('base', taxonomyOptions.bases, state.base)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {groupLabels.filler}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCheckboxGroup('filler', taxonomyOptions.fillers, state.filler)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {groupLabels.auxiliary}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCheckboxGroup('auxiliary', taxonomyOptions.auxiliaries, state.auxiliary)}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-70"
          disabled={isPending}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {resetLabel}
        </button>
      </div>
    </form>
  );
}

export type LangFilterValue = DocumentLanguage | 'all';

export type DocumentFilterValues = {
  types: DocumentType[];
  lang: LangFilterValue;
};

type DocumentFiltersProps = {
  typeOptions: ReadonlyArray<{ value: DocumentType; label: string }>;
  languageOptions: ReadonlyArray<{ value: LangFilterValue; label: string }>;
  applyLabel: string;
  resetLabel: string;
  initialValues: DocumentFilterValues;
  typeLegend: string;
  languageLegend: string;
};

export function DocumentsFilters({
  typeOptions,
  languageOptions,
  applyLabel,
  resetLabel,
  initialValues,
  typeLegend,
  languageLegend,
}: DocumentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState(initialValues);
  const [isPending, startTransition] = useTransition();

  const syncQuery = useCallback(
    (nextState: DocumentFilterValues) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        setMultiParam(params, 'type', nextState.types);
        if (nextState.lang === 'all') {
          params.delete('lang');
        } else {
          params.set('lang', nextState.lang);
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const updateState = useCallback(
    (updater: (prev: DocumentFilterValues) => DocumentFilterValues) => {
      let nextState: DocumentFilterValues | null = null;
      setState((prev) => {
        const next = updater(prev);
        if (next === prev) {
          return prev;
        }
        nextState = next;
        return next;
      });

      if (nextState) {
        syncQuery(nextState);
      }
    },
    [syncQuery]
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      syncQuery(state);
    },
    [state, syncQuery]
  );

  const handleReset = useCallback(() => {
    const cleared: DocumentFilterValues = { types: [], lang: 'all' };
    setState(cleared);
    syncQuery(cleared);
  }, [syncQuery]);

  return (
    <form className="space-y-6" onSubmit={handleSubmit} aria-busy={isPending}>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{typeLegend}</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {typeOptions.map((option) => {
            const id = `type-${option.value}`;
            return (
              <label key={option.value} className="flex items-center gap-2 text-sm text-zinc-700" htmlFor={id}>
                <input
                  id={id}
                  type="checkbox"
                  name="type"
                  value={option.value}
                  checked={state.types.includes(option.value)}
                  onChange={(event) =>
                    updateState((prev) => {
                      const nextValues = toggleValue(prev.types, option.value, event.target.checked);
                      if (nextValues === prev.types) {
                        return prev;
                      }
                      return { ...prev, types: nextValues };
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{languageLegend}</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {languageOptions.map((option) => {
            const id = `lang-${option.value}`;
            return (
              <label key={option.value} className="flex items-center gap-2 text-sm text-zinc-700" htmlFor={id}>
                <input
                  id={id}
                  type="radio"
                  name="lang"
                  value={option.value}
                  checked={state.lang === option.value}
                  onChange={() =>
                    updateState((prev) =>
                      prev.lang === option.value ? prev : { ...prev, lang: option.value }
                    )
                  }
                  className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-70"
          disabled={isPending}
        >
          {applyLabel}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {resetLabel}
        </button>
      </div>
    </form>
  );
}

function updateCategoryParam(params: URLSearchParams, value: CatalogCategory | null) {
  if (value) {
    params.set('category', value);
  } else {
    params.delete('category');
  }
}

function setMultiParam(params: URLSearchParams, key: string, values: string[]) {
  params.delete(key);
  for (const value of values) {
    params.append(key, value);
  }
}

function toggleValue<T extends string>(values: T[], value: T, checked: boolean): T[] {
  const hasValue = values.includes(value);
  if (checked) {
    return hasValue ? values : [...values, value];
  }
  if (!hasValue) {
    return values;
  }
  return values.filter((item) => item !== value);
}

function createEmptyCatalogFilters(): CatalogFilterValues {
  return {
    category: null,
    process: [],
    base: [],
    filler: [],
    auxiliary: [],
  };
}
