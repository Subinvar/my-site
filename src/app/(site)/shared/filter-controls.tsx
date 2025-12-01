'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogFiller,
  CatalogMetal,
  CatalogProcess,
  DocumentLanguage,
  DocumentType,
} from '@/lib/keystatic';

type CatalogTaxonomyOptions = {
  categories: ReadonlyArray<{ value: CatalogCategory; label: string }>;
  processes: ReadonlyArray<{ value: CatalogProcess; label: string }>;
  bases: ReadonlyArray<{ value: CatalogBase; label: string }>;
  fillers: ReadonlyArray<{ value: CatalogFiller; label: string }>;
  metals: ReadonlyArray<{ value: CatalogMetal; label: string }>;
  auxiliaries: ReadonlyArray<{ value: CatalogAuxiliary; label: string }>;
};

type CatalogGroupLabels = {
  category: string;
  process: string;
  base: string;
  filler: string;
  metal: string;
  auxiliary: string;
};

export type CatalogFilterValues = {
  category: CatalogCategory | null;
  process: CatalogProcess[];
  base: CatalogBase[];
  filler: CatalogFiller[];
  metal: CatalogMetal[];
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
  const [state, setState] = useState(initialValues);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setState(initialValues);
  }, [initialValues]);

  const syncQuery = useCallback(
    (nextState: CatalogFilterValues, options?: { navigate?: boolean }) => {
      const shouldNavigate = options?.navigate !== false;
      setIsPending(true);
      const params = new URLSearchParams();
      updateCategoryParam(params, nextState.category);
      setMultiParam(params, 'process', nextState.process);
      setMultiParam(params, 'base', nextState.base);
      setMultiParam(params, 'filler', nextState.filler);
      setMultiParam(params, 'metal', nextState.metal);
      setMultiParam(params, 'auxiliary', nextState.auxiliary);
      const query = params.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;

      try {
        if (shouldNavigate) {
          router.replace(nextUrl, { scroll: false });
          router.refresh();
        } else if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', nextUrl);
        }
      } finally {
        setIsPending(false);
      }
    },
    [pathname, router]
  );

  const applyNextState = useCallback(
    (nextState: CatalogFilterValues) => {
      setState(nextState);
      void syncQuery(nextState);
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
    applyNextState(cleared);
  }, [applyNextState]);

  const renderCategoryOption = (value: CatalogCategory | null, label: string) => {
    const id = value ? `category-${value}` : 'category-all';
    return (
        <label key={id} className="flex items-center gap-2 text-sm text-muted-foreground" htmlFor={id}>
        <input
          id={id}
          type="radio"
          name="category"
          value={value ?? ''}
          checked={state.category === value}
          onChange={() => {
            if (state.category === value) {
              return;
            }
            applyNextState({ ...state, category: value });
          }}
          className="h-4 w-4 border-border text-brand-600 focus:ring-brand-600"
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
          <label key={option.value} className="flex items-center gap-2 text-sm text-muted-foreground" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            name={name}
            value={option.value}
            checked={selected.includes(option.value)}
            data-testid="catalog-filter-checkbox"
            onChange={(event) => {
              const nextValues = toggleValue(state[name] as T[], option.value, event.target.checked);
              if (nextValues === state[name]) {
                return;
              }
              applyNextState({ ...state, [name]: nextValues } as CatalogFilterValues);
            }}
            className="h-4 w-4 border-border text-brand-600 focus:ring-brand-600"
          />
          {option.label}
        </label>
      );
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} aria-busy={isPending}>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {groupLabels.category}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCategoryOption(null, categoryAllLabel)}
          {taxonomyOptions.categories.map((option) => renderCategoryOption(option.value, option.label))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {groupLabels.process}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCheckboxGroup('process', taxonomyOptions.processes, state.process)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {groupLabels.base}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCheckboxGroup('base', taxonomyOptions.bases, state.base)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {groupLabels.filler}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCheckboxGroup('filler', taxonomyOptions.fillers, state.filler)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {groupLabels.metal}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCheckboxGroup('metal', taxonomyOptions.metals, state.metal)}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {groupLabels.auxiliary}
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {renderCheckboxGroup('auxiliary', taxonomyOptions.auxiliaries, state.auxiliary)}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-70"
          disabled={isPending}
        >
          {submitLabel}
        </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
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

  useEffect(() => {
    setState(initialValues);
  }, [initialValues]);

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
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{typeLegend}</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {typeOptions.map((option) => {
            const id = `type-${option.value}`;
            return (
                <label key={option.value} className="flex items-center gap-2 text-sm text-muted-foreground" htmlFor={id}>
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
                  className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-600"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{languageLegend}</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {languageOptions.map((option) => {
            const id = `lang-${option.value}`;
            return (
                <label key={option.value} className="flex items-center gap-2 text-sm text-muted-foreground" htmlFor={id}>
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
                  className="h-4 w-4 border-border text-brand-600 focus:ring-brand-600"
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
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-70"
          disabled={isPending}
        >
          {applyLabel}
        </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
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
    metal: [],
    auxiliary: [],
  };
}
