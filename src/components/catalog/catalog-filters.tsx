'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogFiller,
  CatalogMetal,
  CatalogProcess,
} from '@/lib/catalog/constants';
import { DEFAULT_PAGE_SIZE } from '@/app/(site)/shared/catalog-filtering';
import type { FilterState } from '@/app/(site)/shared/catalog-filtering';
import { Button } from '@/app/(site)/shared/ui/button';
import { Checkbox } from '@/app/(site)/shared/ui/checkbox';
import type { Locale } from '@/lib/i18n';

import type { CatalogView } from './catalog-url';

export type CatalogFiltersState = FilterState;

export type CatalogFiltersProps = {
  locale: Locale;
  state: CatalogFiltersState;
  view: CatalogView;
  auxiliaryCategory: CatalogCategory;
  groupLabels: {
    category?: string;
    process?: string;
    base?: string;
    filler?: string;
    metal?: string;
    auxiliary?: string;
  };
  options: {
    categories: ReadonlyArray<{ value: CatalogCategory; label: string }>;
    processes: ReadonlyArray<{ value: CatalogProcess; label: string }>;
    bases: ReadonlyArray<{ value: CatalogBase; label: string }>;
    fillers: ReadonlyArray<{ value: CatalogFiller; label: string }>;
    metals: ReadonlyArray<{ value: CatalogMetal; label: string }>;
    auxiliaries: ReadonlyArray<{ value: CatalogAuxiliary; label: string }>;
  };
  submitLabel?: string;
  resetLabel?: string;
};

export function CatalogFiltersMobileTrigger({
  locale,
  state,
  view,
  auxiliaryCategory,
  groupLabels,
  options,
  submitLabel,
  resetLabel,
}: CatalogFiltersProps) {
  const [open, setOpen] = React.useState(false);
  const triggerLabel = locale === 'ru' ? 'Фильтры' : 'Filters';
  const closeLabel = locale === 'ru' ? 'Закрыть фильтры' : 'Close filters';

  return (
    <>
      <div className="mb-2 flex items-center justify-between lg:hidden">
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)} className="gap-2">
          <FilterIcon className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[360px] flex-col bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{triggerLabel}</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <CatalogFilters
                locale={locale}
                state={state}
                view={view}
                auxiliaryCategory={auxiliaryCategory}
                groupLabels={groupLabels}
                options={options}
                submitLabel={submitLabel}
                resetLabel={resetLabel}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CatalogFilters({
  locale,
  state,
  view,
  auxiliaryCategory,
  groupLabels,
  options,
  submitLabel,
  resetLabel,
}: CatalogFiltersProps) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const autoSubmit = React.useCallback(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const formData = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string' && value.trim()) {
        params.append(key, value);
      }
    }

    params.delete('offset');
    params.set('limit', String(DEFAULT_PAGE_SIZE));

    const target = params.toString();
    const action = form.getAttribute('action') || pathname || '/catalog';

    // Client-side navigation (no hard reload). Inputs stay responsive, and the
    // server page re-renders with updated search params.
    router.replace(target ? `${action}?${target}` : action, { scroll: false });
  }, [pathname, router]);
  const submitText = submitLabel ?? (locale === 'ru' ? 'Показать' : 'Show');
  const resetText = resetLabel ?? (locale === 'ru' ? 'Сбросить' : 'Reset');
  const labels = {
    category: groupLabels.category ?? 'Категория',
    process: groupLabels.process ?? 'Процесс',
    base: groupLabels.base ?? 'Основа',
    filler: groupLabels.filler ?? 'Наполнитель',
    metal: groupLabels.metal ?? 'Металл',
    auxiliary: groupLabels.auxiliary ?? 'Вспомогательные',
  };

  const isAuxiliaryCategorySelected = state.category.lookup.has(auxiliaryCategory);

  // NOTE: checkboxes use `defaultChecked`, so we force-remount the <form>
  // whenever the filter state changes (client-side navigation), otherwise
  // DOM state can drift from URL state.
  const formKey = React.useMemo(() => {
    const join = (values: string[]) => values.join(',');
    return [
      state.q ?? '',
      state.sort ?? '',
      join(state.category.values),
      join(state.process.values),
      join(state.base.values),
      join(state.filler.values),
      join(state.metal.values),
      join(state.auxiliary.values),
    ].join('|');
  }, [
    state.q,
    state.sort,
    state.category.values,
    state.process.values,
    state.base.values,
    state.filler.values,
    state.metal.values,
    state.auxiliary.values,
  ]);

  return (
    <form
      key={formKey}
      ref={formRef}
      className="space-y-4 text-sm"
      method="GET"
      onSubmit={(event) => {
        event.preventDefault();
        autoSubmit();
      }}
    >
      {state.q ? <input type="hidden" name="q" value={state.q} /> : null}
      {state.sort && state.sort !== 'name' ? (
        <input type="hidden" name="sort" value={state.sort} />
      ) : null}
      {view === 'list' ? <input type="hidden" name="view" value="list" /> : null}

      <FiltersGroup title={labels.category}>
        {options.categories.map((option) => (
          <CheckboxOption
            key={option.value}
            name="category"
            value={option.value}
            label={option.label}
            checked={state.category.values.includes(option.value)}
            onChange={autoSubmit}
            testId="catalog-filter-checkbox"
          />
        ))}
      </FiltersGroup>

      <FiltersGroup title={labels.process}>
        {options.processes.map((option) => (
          <CheckboxOption
            key={option.value}
            name="process"
            value={option.value}
            label={option.label}
            checked={state.process.values.includes(option.value)}
            onChange={autoSubmit}
            testId="catalog-filter-checkbox"
          />
        ))}
      </FiltersGroup>

      <FiltersGroup title={labels.base}>
        {options.bases.map((option) => (
          <CheckboxOption
            key={option.value}
            name="base"
            value={option.value}
            label={option.label}
            checked={state.base.values.includes(option.value)}
            onChange={autoSubmit}
            testId="catalog-filter-checkbox"
          />
        ))}
      </FiltersGroup>

      <FiltersGroup title={labels.filler}>
        {options.fillers.map((option) => (
          <CheckboxOption
            key={option.value}
            name="filler"
            value={option.value}
            label={option.label}
            checked={state.filler.values.includes(option.value)}
            onChange={autoSubmit}
            testId="catalog-filter-checkbox"
          />
        ))}
      </FiltersGroup>

      <FiltersGroup title={labels.metal}>
        {options.metals.map((option) => (
          <CheckboxOption
            key={option.value}
            name="metal"
            value={option.value}
            label={option.label}
            checked={state.metal.values.includes(option.value)}
            onChange={autoSubmit}
            testId="catalog-filter-checkbox"
          />
        ))}
      </FiltersGroup>

      <FiltersGroup title={labels.auxiliary} defaultOpen={isAuxiliaryCategorySelected}>
        {isAuxiliaryCategorySelected ? (
          options.auxiliaries.map((option) => (
            <CheckboxOption
              key={option.value}
              name="auxiliary"
              value={option.value}
              label={option.label}
              checked={state.auxiliary.values.includes(option.value)}
              onChange={autoSubmit}
              testId="catalog-filter-checkbox"
            />
          ))
        ) : (
          <p className="text-xs text-muted-foreground">
            {locale === 'ru'
              ? 'Выберите категорию «Вспомогательные материалы», чтобы выбрать тип.'
              : 'Select the “Auxiliary materials” category to choose a type.'}
          </p>
        )}
      </FiltersGroup>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="w-full">
          {submitText}
        </Button>
        <ClearFiltersButton label={resetText} view={view} />
      </div>
    </form>
  );
}

function FiltersGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section className="border-b border-border pb-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-2 text-left font-medium"
      >
        <span>{title}</span>
        <span className="text-lg leading-none">{open ? '−' : '+'}</span>
      </button>

      {open ? <div className="space-y-1 pb-2">{children}</div> : null}
    </section>
  );
}

function CheckboxOption(props: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange?: () => void;
  testId?: string;
}) {
  return (
    <Checkbox
      name={props.name}
      value={props.value}
      label={props.label}
      defaultChecked={props.checked}
      data-testid={props.testId}
      onChange={props.onChange}
    />
  );
}

function ClearFiltersButton({ label, view }: { label: string; view: CatalogView }) {
  const pathname = usePathname();
  const router = useRouter();

  const target = view === 'list' ? `${pathname}?view=list` : pathname;

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      onClick={() => router.replace(target, { scroll: false })}
    >
      {label}
    </Button>
  );
}

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
    </svg>
  );
}
