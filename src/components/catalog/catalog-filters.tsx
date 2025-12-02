'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

import type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogFiller,
  CatalogMetal,
  CatalogProcess,
} from '@/lib/catalog/constants';
import type { FilterState } from '@/app/(site)/shared/catalog-filtering';
import { Button } from '@/app/(site)/shared/ui/button';

export type CatalogFiltersState = FilterState;

export type CatalogFiltersProps = {
  locale: string;
  state: CatalogFiltersState;
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-outline text-sm"
        >
          {triggerLabel}
        </button>
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
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-button"
                aria-label={closeLabel}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <CatalogFilters
                locale={locale}
                state={state}
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
  groupLabels,
  options,
  submitLabel,
  resetLabel,
}: CatalogFiltersProps) {
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

  return (
    <form className="space-y-4 text-sm" method="GET">
      {state.q ? <input type="hidden" name="q" value={state.q} /> : null}
      {state.sort && state.sort !== 'name' ? (
        <input type="hidden" name="sort" value={state.sort} />
      ) : null}

      <FiltersGroup title={labels.category}>
        {options.categories.map((option) => (
          <CheckboxOption
            key={option.value}
            name="category"
            value={option.value}
            label={option.label}
            checked={state.category.values.includes(option.value)}
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
          />
        ))}
      </FiltersGroup>

      <FiltersGroup title={labels.auxiliary}>
        {options.auxiliaries.map((option) => (
          <CheckboxOption
            key={option.value}
            name="auxiliary"
            value={option.value}
            label={option.label}
            checked={state.auxiliary.values.includes(option.value)}
          />
        ))}
      </FiltersGroup>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="w-full">
          {submitText}
        </Button>
        <ClearFiltersButton label={resetText} />
      </div>
    </form>
  );
}

function FiltersGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);

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
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name={props.name}
        value={props.value}
        defaultChecked={props.checked}
        className="checkbox h-4 w-4 rounded border border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <span>{props.label}</span>
    </label>
  );
}

function ClearFiltersButton({ label }: { label: string }) {
  const pathname = usePathname();

  return (
    <Button variant="secondary" className="w-full" asChild>
      <a href={pathname}>{label}</a>
    </Button>
  );
}
