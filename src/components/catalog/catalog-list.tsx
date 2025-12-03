import type { CatalogFiltersProps } from './catalog-filters';
import { Card, CardFooter, CardTitle, type CardProps } from '@/app/(site)/shared/ui/card';
import { Button } from '@/app/(site)/shared/ui/button';
import { buildPath } from '@/lib/paths';
import type { CatalogListItem } from '@/app/(site)/shared/catalog-filtering';
import type { Locale } from '@/lib/i18n';
import type { CatalogBadge } from '@/lib/keystatic';

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
  const requestHref = `${buildPath(locale, ['contacts'])}?product=${encodeURIComponent(item.title)}`;
  const summary = item.shortDescription;
  const badge = resolveBadge(item.badge, locale);
  const processLabels = item.process.map((process) => resolveProcessLabel(process, labelMaps));
  const categoryLabel = item.category ? labelMaps.category.get(item.category) ?? item.category : null;

  return (
    <Card as="article" className="flex h-full flex-col" {...cardProps}>
      <div className="flex flex-1 flex-col gap-3">
        <header className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
            <ProductBadge badgeData={badge} />
          </div>
          {summary ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{summary}</p>
          ) : null}
        </header>

        <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
          <ProcessChip processLabels={processLabels} />
          <CategoryChip label={categoryLabel} />
          {item.base.map((base) => (
            <Chip key={base}>{labelMaps.base.get(base) ?? base}</Chip>
          ))}
          {item.filler.map((filler) => (
            <Chip key={filler}>{labelMaps.filler.get(filler) ?? filler}</Chip>
          ))}
          {item.metals.map((metal) => (
            <Chip key={metal}>{labelMaps.metals.get(metal) ?? metal}</Chip>
          ))}
          {item.auxiliary.map((auxiliary) => (
            <Chip key={auxiliary}>{labelMaps.auxiliary.get(auxiliary) ?? auxiliary}</Chip>
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

function resolveProcessLabel(
  process: CatalogListItem['process'][number],
  labelMaps: ReturnType<typeof createLabelMaps>
) {
  const mapped = labelMaps.process.get(process);
  if (mapped) {
    return mapped;
  }

  if (process === 'alpha-set') {
    return 'Alpha-set';
  }
  if (process === 'furan') {
    return 'Фуран';
  }

  return process;
}

function resolveBadge(
  badge: CatalogListItem['badge'],
  locale: Locale
): { label: string; className: string } | null {
  if (!badge) {
    return null;
  }

  const labelMap: Record<CatalogBadge, { ru: string; en: string }> = {
    bestseller: { ru: 'Хит продаж', en: 'Bestseller' },
    premium: { ru: 'Премиум', en: 'Premium' },
    eco: { ru: 'Eco', en: 'Eco' },
    special: { ru: 'Спец.решение', en: 'Special' },
  };

  const classMap: Record<CatalogBadge, string> = {
    bestseller: 'bg-amber-100 text-amber-800',
    premium: 'bg-purple-100 text-purple-800',
    eco: 'bg-emerald-100 text-emerald-800',
    special: 'bg-sky-100 text-sky-800',
  };

  return {
    label: locale === 'ru' ? labelMap[badge].ru : labelMap[badge].en,
    className: classMap[badge],
  };
}

function ProductBadge({ badgeData }: { badgeData: ReturnType<typeof resolveBadge> }) {
  if (!badgeData) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeData.className}`}
    >
      {badgeData.label}
    </span>
  );
}

function ProcessChip({ processLabels }: { processLabels: string[] }) {
  if (!processLabels.length) {
    return null;
  }

  return processLabels.map((label, index) => (
    <span
      key={`${label}-${index}`}
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground"
    >
      {label}
    </span>
  ));
}

function CategoryChip({ label }: { label: string | null }) {
  if (!label) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}
