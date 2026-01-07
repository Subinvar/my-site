import Link from 'next/link';

import type { CatalogFiltersProps } from './catalog-filters';
import type { CatalogView } from './catalog-url';
import { Button } from '@/app/(site)/shared/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/(site)/shared/ui/card';
import { getInterfaceDictionary } from '@/content/dictionary';
import { cn } from '@/lib/cn';
import type { Locale } from '@/lib/i18n';
import type { CatalogListItem, CatalogBadge } from '@/lib/keystatic';
import { buildPath } from '@/lib/paths';

export type CatalogListProps = {
  locale: Locale;
  items: CatalogListItem[];
  options: CatalogFiltersProps['options'];
  auxiliaryCategory: string;
  view?: CatalogView;
  detailLabel?: string;
  requestLabel?: string;
};

export function CatalogList({
  locale,
  items,
  options,
  auxiliaryCategory,
  view = 'grid',
  detailLabel = locale === 'ru' ? 'Подробнее' : 'Details',
  requestLabel = locale === 'ru' ? 'Запросить КП' : 'Request a quote',
}: CatalogListProps) {
  const labelMaps = createLabelMaps(options);
  const dict = getInterfaceDictionary(locale);
  const a = dict.catalog.attributes;

  if (!items.length) {
    return null;
  }

  const isList = view === 'list';

  return (
    <div
      className={cn(
        isList ? 'space-y-3' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
        'items-stretch'
      )}
    >
      {items.map((item) => {
        const href = buildPath(locale, ['catalog', item.slug]);
        const requestHref = `${buildPath(locale, ['contacts'])}?product=${encodeURIComponent(
          item.title
        )}`;

        const badge = resolveBadge(item.badge, locale);

        const categoryLabel = item.category ? labelMaps.category.get(item.category) ?? null : null;
        const processLabels = item.process
          .map((value) => labelMaps.process.get(value))
          .filter(Boolean) as string[];
        const baseLabels = item.base.map((value) => labelMaps.base.get(value)).filter(Boolean) as string[];
        const fillerLabels = item.filler
          .map((value) => labelMaps.filler.get(value))
          .filter(Boolean) as string[];
        const metalLabels = item.metals
          .map((value) => labelMaps.metal.get(value))
          .filter(Boolean) as string[];
        const auxiliaryLabels = item.auxiliary
          .map((value) => labelMaps.auxiliary.get(value))
          .filter(Boolean) as string[];

        const specs: Array<{ label: string; value: string | null }> = [
          { label: a.category, value: categoryLabel },
          { label: a.process, value: formatList(processLabels, 2) },
          { label: a.base, value: formatList(baseLabels, 2) },
          { label: a.metal, value: formatList(metalLabels, 2) },
        ];

        if (item.category === auxiliaryCategory) {
          specs.push({ label: a.auxiliary, value: formatList(auxiliaryLabels, 2) });
        } else {
          // Non-auxiliary items: show filler if it exists.
          if (fillerLabels.length) {
            specs.push({ label: a.filler, value: formatList(fillerLabels, 2) });
          }
        }

        const summary = item.shortDescription ?? item.teaser ?? item.excerpt ?? null;

        const headerChips = (
          <div className="flex flex-wrap items-center gap-2">
            {processLabels.length ? <Pill>{processLabels[0]}</Pill> : null}
            {categoryLabel ? <Pill variant="muted">{categoryLabel}</Pill> : null}
            {badge.label ? <ProductBadge badgeData={badge} /> : null}
          </div>
        );

        if (isList) {
          return (
            <Card as="article" key={item.slug} data-testid="catalog-item" className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  {headerChips}
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold leading-snug">
                      <Link href={href} className="hover:underline">
                        {item.title}
                      </Link>
                    </h3>
                    {summary ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">{summary}</p>
                    ) : null}
                  </div>
                  <SpecList specs={specs} />
                </div>

                <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={href}>{detailLabel}</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={requestHref}>{requestLabel}</Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        }

        return (
          <Card as="article" key={item.slug} data-testid="catalog-item" className="flex h-full flex-col">
            <CardHeader className="space-y-3">
              {headerChips}

              <div className="space-y-1">
                <CardTitle className="text-base leading-snug">
                  <Link href={href} className="hover:underline">
                    {item.title}
                  </Link>
                </CardTitle>
                {summary ? (
                  <CardDescription className="line-clamp-2">{summary}</CardDescription>
                ) : null}
              </div>

              <SpecList specs={specs} className="pt-1" />
            </CardHeader>

            <CardFooter className="mt-auto flex flex-col gap-2 sm:flex-row">
              <Button asChild size="sm" variant="secondary" className="w-full">
                <Link href={href}>{detailLabel}</Link>
              </Button>
              <Button asChild size="sm" className="w-full">
                <Link href={requestHref}>{requestLabel}</Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

function SpecList({
  specs,
  className,
}: {
  specs: Array<{ label: string; value: string | null }>;
  className?: string;
}) {
  const visible = specs.filter((spec) => spec.value);
  if (!visible.length) {
    return null;
  }

  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-2 text-xs', className)}>
      {visible.map((spec) => (
        <div key={spec.label} className="min-w-0">
          <dt className="text-muted-foreground">{spec.label}</dt>
          <dd className="font-medium text-foreground truncate">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatList(values: string[], max: number): string | null {
  const list = values.filter(Boolean);
  if (!list.length) {
    return null;
  }
  if (list.length <= max) {
    return list.join(', ');
  }
  return `${list.slice(0, max).join(', ')} +${list.length - max}`;
}

function createLabelMaps(options: CatalogFiltersProps['options']) {
  return {
    category: new Map(options.categories.map((option) => [option.value, option.label] as const)),
    process: new Map(options.processes.map((option) => [option.value, option.label] as const)),
    base: new Map(options.bases.map((option) => [option.value, option.label] as const)),
    filler: new Map(options.fillers.map((option) => [option.value, option.label] as const)),
    metal: new Map(options.metals.map((option) => [option.value, option.label] as const)),
    auxiliary: new Map(options.auxiliaries.map((option) => [option.value, option.label] as const)),
  };
}

function resolveBadge(badge: CatalogBadge | null, locale: Locale) {
  if (!badge) {
    return {
      label: null,
      className: null,
    };
  }
  switch (badge) {
    case 'bestseller':
      return {
        label: locale === 'ru' ? 'Хит продаж' : 'Bestseller',
        className:
          'bg-[color:var(--color-brand-600)] text-white border-[color:var(--color-brand-600)]',
      };
    case 'premium':
      return {
        label: locale === 'ru' ? 'Премиум' : 'Premium',
        className:
          'bg-[color:var(--color-amber-100)] text-[color:var(--color-amber-900)] border-[color:var(--color-amber-200)]',
      };
    case 'eco':
      return {
        label: locale === 'ru' ? 'Eco' : 'Eco',
        className:
          'bg-[color:var(--color-emerald-100)] text-[color:var(--color-emerald-900)] border-[color:var(--color-emerald-200)]',
      };
    case 'special':
      return {
        label: locale === 'ru' ? 'Спецпродукт' : 'Special',
        className:
          'bg-[color:var(--color-surface-2)] text-foreground border-[color:var(--color-border)]',
      };
    default:
      return {
        label: null,
        className: null,
      };
  }
}

function Pill({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'muted' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        variant === 'default'
          ? 'border-[color:var(--color-brand-200)] bg-[color:var(--color-brand-50)] text-[color:var(--color-brand-700)]'
          : 'border-border bg-muted text-foreground'
      )}
    >
      {children}
    </span>
  );
}

function ProductBadge({ badgeData }: { badgeData: ReturnType<typeof resolveBadge> }) {
  if (!badgeData.label) {
    return null;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
        badgeData.className
      )}
    >
      {badgeData.label}
    </span>
  );
}
