'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { applyFilters, parseFilters, type FilterState } from './catalog-filtering';
import { buildPath } from '@/lib/paths';
import type { CatalogTaxonomyValues } from '@/lib/catalog/constants';
import type { CatalogListItem } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';

function toRecord(params: URLSearchParams): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  params.forEach((value, key) => {
    const current = record[key];
    if (Array.isArray(current)) {
      record[key] = [...current, value];
    } else if (typeof current === 'string') {
      record[key] = [current, value];
    } else {
      record[key] = value;
    }
  });
  return record;
}

type CatalogListingProps = {
  items: CatalogListItem[];
  initialFilters: FilterState;
  emptyStateMessage: string;
  detailLabel: string;
  locale: Locale;
  taxonomy: CatalogTaxonomyValues;
};

export function CatalogListing({
  items,
  initialFilters,
  emptyStateMessage,
  detailLabel,
  locale,
  taxonomy,
}: CatalogListingProps) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => {
    if (!searchParams) {
      return initialFilters;
    }
    return parseFilters(toRecord(searchParams), taxonomy);
  }, [initialFilters, searchParams, taxonomy]);

  const filteredItems = useMemo(() => applyFilters(items, filters, taxonomy), [items, filters, taxonomy]);

  if (filteredItems.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
        {emptyStateMessage}
      </p>
    );
  }

  return (
    <ul className="grid gap-8 md:grid-cols-2">
      {filteredItems.map((item) => (
        <li key={`${item.id}:${item.slug}`}>
          <article className="flex h-full flex-col gap-4 rounded-lg border border-border bg-background p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground" data-testid="catalog-item">
                  {item.title}
                </h2>
                {item.excerpt ? <p className="mt-1 text-sm text-muted-foreground">{item.excerpt}</p> : null}
              </div>
              {item.image ? (
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-100 bg-card">
                  <Image
                    src={item.image.src}
                    alt=""
                    fill
                    sizes="80px"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : null}
            </div>
            <dl className="grid gap-3 rounded-md bg-card p-3 text-xs text-zinc-700 sm:grid-cols-2">
              {item.category ? (
                <div className="space-y-1">
                  <dt className="font-semibold uppercase tracking-wide">Категория</dt>
                  <dd>{item.category}</dd>
                </div>
              ) : null}
              {item.process.length > 0 ? (
                <div className="space-y-1">
                  <dt className="font-semibold uppercase tracking-wide">Процесс</dt>
                  <dd>{item.process.join(', ')}</dd>
                </div>
              ) : null}
              {item.base.length > 0 ? (
                <div className="space-y-1">
                  <dt className="font-semibold uppercase tracking-wide">Основа</dt>
                  <dd>{item.base.join(', ')}</dd>
                </div>
              ) : null}
              {item.filler.length > 0 ? (
                <div className="space-y-1">
                  <dt className="font-semibold uppercase tracking-wide">Наполнитель</dt>
                  <dd>{item.filler.join(', ')}</dd>
                </div>
              ) : null}
              {item.metals.length > 0 ? (
                <div className="space-y-1">
                  <dt className="font-semibold uppercase tracking-wide">Металл</dt>
                  <dd>{item.metals.join(', ')}</dd>
                </div>
              ) : null}
              {item.auxiliary.length > 0 ? (
                <div className="space-y-1">
                  <dt className="font-semibold uppercase tracking-wide">Вспомогательное</dt>
                  <dd>{item.auxiliary.join(', ')}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-auto flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {item.updatedAt ? <time dateTime={item.updatedAt}>{item.updatedAt}</time> : null}
              </div>
              <Link
                href={buildPath(locale, ['catalog', item.slug])}
                className="text-sm font-semibold text-brand-700 hover:text-brand-600"
              >
                {detailLabel}
              </Link>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
