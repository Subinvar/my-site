import type { CatalogFiltersProps } from './catalog-filters';
import { Card, CardFooter, CardTitle, type CardProps } from '@/app/(site)/shared/ui/card';
import { Badge } from '@/app/(site)/shared/ui/badge';
import { Button } from '@/app/(site)/shared/ui/button';
import { buildPath } from '@/lib/paths';
import type { CatalogListItem } from '@/app/(site)/shared/catalog-filtering';
import type { Locale } from '@/lib/i18n';

export type CatalogListProps = {
  items: CatalogListItem[];
  locale: Locale;
  taxonomyOptions: CatalogFiltersProps['options'];
  emptyStateMessage?: string;
  detailLabel?: string;
  requestLabel?: string;
};

export function CatalogList({
  items,
  locale,
  taxonomyOptions,
  emptyStateMessage,
  detailLabel = 'Подробнее',
  requestLabel = 'Запросить КП',
}: CatalogListProps) {
  const labelMaps = createLabelMaps(taxonomyOptions);

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        {emptyStateMessage ||
          'По выбранным параметрам ничего не найдено. Попробуйте снять часть фильтров или изменить запрос.'}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <CatalogItemCard
          key={item.slug}
          data-testid="catalog-item"
          item={item}
          locale={locale}
          labelMaps={labelMaps}
          detailLabel={detailLabel}
          requestLabel={requestLabel}
        />
      ))}
    </div>
  );
}

function CatalogItemCard({
  item,
  locale,
  labelMaps,
  detailLabel,
  requestLabel,
  ...cardProps
}: {
  item: CatalogListItem;
  locale: Locale;
  labelMaps: ReturnType<typeof createLabelMaps>;
  detailLabel: string;
  requestLabel: string;
} & CardProps) {
  const detailHref = buildPath(locale, ['catalog', item.slug]);
  const requestHref = `${buildPath(locale, ['contacts'])}?product=${encodeURIComponent(item.slug)}`;
  const summary = item.teaser ?? item.excerpt;

  return (
    <Card as="article" className="flex h-full flex-col" {...cardProps}>
      <div className="flex flex-1 flex-col gap-3">
        <header className="space-y-1">
          <CardTitle className="text-base">{item.title}</CardTitle>
          {summary ? (
            <p className="text-sm text-muted-foreground line-clamp-3">{summary}</p>
          ) : null}
        </header>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {item.category ? (
            <Badge className="bg-[color-mix(in_srgb,var(--color-brand-600)_12%,transparent)] text-[var(--color-brand-700)]">
              {labelMaps.category.get(item.category) ?? item.category}
            </Badge>
          ) : null}
          {item.process.map((process) => (
            <Badge
              key={process}
              className="border border-border bg-background text-[var(--foreground)]"
            >
              {labelMaps.process.get(process) ?? process}
            </Badge>
          ))}
          {item.metals.map((metal) => (
            <Badge key={metal} className="bg-[var(--muted)] text-[var(--foreground)]">
              {labelMaps.metals.get(metal) ?? metal}
            </Badge>
          ))}
        </div>
      </div>

      <CardFooter className="mt-3 flex justify-between gap-2">
        <Button asChild variant="link" size="sm">
          <a href={detailHref}>{detailLabel}</a>
        </Button>
        <Button asChild size="sm" className="min-w-[150px] justify-center">
          <a href={requestHref}>{requestLabel}</a>
        </Button>
      </CardFooter>
    </Card>
  );
}

function createLabelMaps(options: CatalogFiltersProps['options']) {
  return {
    category: new Map(options.categories.map((option) => [option.value, option.label])),
    process: new Map(options.processes.map((option) => [option.value, option.label])),
    base: new Map(options.bases.map((option) => [option.value, option.label])),
    filler: new Map(options.fillers.map((option) => [option.value, option.label])),
    metals: new Map(options.metals.map((option) => [option.value, option.label])),
    auxiliary: new Map(options.auxiliaries.map((option) => [option.value, option.label])),
  };
}
