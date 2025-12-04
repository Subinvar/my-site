import Image from 'next/image';
import Link from 'next/link';

import type { CatalogListItem } from '../catalog-filtering';
import { Card, CardTitle, CardDescription, CardFooter } from './card';
import { Tag } from './tag';

export type AttributeLabels = {
  category: string;
  process: string;
  base: string;
  filler: string;
  auxiliary: string;
  metal: string;
};

type CatalogItemCardProps = {
  item: CatalogListItem;
  detailHref: string;
  detailLabel: string;
  attributeLabels: AttributeLabels;
  valueLabels: CatalogValueLabels;
};

export function CatalogItemCard({ item, detailHref, detailLabel, attributeLabels, valueLabels }: CatalogItemCardProps) {
  const tagLabels = buildTags(item, valueLabels);
  const summary = item.teaser ?? item.excerpt;

  return (
    <Card as="article" className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle data-testid="catalog-item" className="text-lg">
            {item.title}
          </CardTitle>
          {summary ? (
            <CardDescription className="mt-1 text-sm">{summary}</CardDescription>
          ) : null}
          {tagLabels.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {tagLabels.map((label) => (
                <Tag key={label} active disabled aria-hidden>
                  {label}
                </Tag>
              ))}
            </div>
          ) : null}
        </div>
        {item.image ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
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

      <dl className="grid gap-3 rounded-md bg-[var(--card)] p-3 text-xs text-[var(--muted-foreground)] sm:grid-cols-2">
        {item.category ? (
          <Attribute label={attributeLabels.category} value={item.category} />
        ) : null}
        {item.process.length > 0 ? (
          <Attribute label={attributeLabels.process} value={item.process.join(', ')} />
        ) : null}
        {item.base.length > 0 ? (
          <Attribute label={attributeLabels.base} value={item.base.join(', ')} />
        ) : null}
        {item.filler.length > 0 ? (
          <Attribute label={attributeLabels.filler} value={item.filler.join(', ')} />
        ) : null}
        {item.metals.length > 0 ? (
          <Attribute label={attributeLabels.metal} value={item.metals.join(', ')} />
        ) : null}
        {item.auxiliary.length > 0 ? (
          <Attribute label={attributeLabels.auxiliary} value={item.auxiliary.join(', ')} />
        ) : null}
      </dl>

      <CardFooter>
        <div className="text-xs text-[var(--muted-foreground)]">
          {item.updatedAt ? <time dateTime={item.updatedAt}>{item.updatedAt}</time> : null}
        </div>
        <Link
          href={detailHref}
          className="inline-flex items-center text-sm font-semibold text-[var(--color-brand-600)] underline-offset-4 transition-colors duration-150 hover:text-[var(--color-brand-700)] hover:underline"
        >
          {detailLabel}
          <span
            aria-hidden
            className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-transparent text-xs transition-all duration-150 group-hover:translate-x-0.5 group-hover:border-[var(--color-brand-400)]"
          >
            →
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}

export type CatalogValueLabels = {
  category: Map<string, string>;
  process: Map<string, string>;
  base: Map<string, string>;
  filler: Map<string, string>;
  metal: Map<string, string>;
  auxiliary: Map<string, string>;
};

function buildTags(item: CatalogListItem, labels: CatalogValueLabels): string[] {
  const tagSet = new Set<string>();

  const addFrom = (values: string[], map: Map<string, string>) => {
    for (const value of values) {
      tagSet.add(map.get(value) ?? value);
    }
  };

  if (item.category) {
    tagSet.add(labels.category.get(item.category) ?? item.category);
  }
  addFrom(item.base, labels.base);
  addFrom(item.filler, labels.filler);
  addFrom(item.metals, labels.metal);
  addFrom(item.process, labels.process);
  addFrom(item.auxiliary, labels.auxiliary);

  return [...tagSet].slice(0, 6);
}

function Attribute({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="font-semibold uppercase tracking-wide text-[var(--foreground)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
