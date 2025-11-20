import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  AUXILIARY_CATEGORY,
  getCatalogProductPage,
  getCatalogTaxonomyLabel,
  getLocalizedCatalogParams,
  resolveCatalogProductMetadata,
} from '@/app/(site)/shared/catalog';
import { getInterfaceDictionary } from '@/content/dictionary';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, switchLocalePath, buildPath } from '@/lib/paths';
import { isLocale, type Locale } from '@/lib/i18n';
const TAXONOMY_KEYS = {
  process: 'processes',
  base: 'bases',
  filler: 'fillers',
  auxiliary: 'auxiliaries',
} as const;

type CatalogProductParams = { locale: Locale; slug: string };

type CatalogProductPageProps = {
  params: Promise<CatalogProductParams>;
};

export default async function CatalogProductPage({ params }: CatalogProductPageProps) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [data, shell] = await Promise.all([
    getCatalogProductPage(locale, slug),
    getSiteShellData(locale),
  ]);

  if (!data) {
    notFound();
  }

  const { item, content, summary } = data;
  const targetLocale = findTargetLocale(locale);
  const switcherHref = switchLocalePath(locale, targetLocale, {
    collection: 'catalog',
    slugs: item.slugByLocale,
  });
  const currentPath = buildPath(locale, ['catalog', slug]);
  const dictionary = getInterfaceDictionary(locale);
  const attributes = dictionary.catalog.attributes;
  const emptyValue = dictionary.common.emptyValue;
  const categoryValue =
    item.category && typeof item.category === 'string'
      ? getCatalogTaxonomyLabel('categories', item.category, locale) ?? item.category
      : emptyValue;
  const processValues = mapAttributeValues(item.process, TAXONOMY_KEYS.process, locale);
  const baseValues = mapAttributeValues(item.base, TAXONOMY_KEYS.base, locale);
  const fillerValues = mapAttributeValues(item.filler, TAXONOMY_KEYS.filler, locale);
  const auxiliaryValues = mapAttributeValues(item.auxiliary, TAXONOMY_KEYS.auxiliary, locale);
  const showAuxiliary = item.category === AUXILIARY_CATEGORY;

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
    >
      <article className="space-y-10">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-zinc-500">{attributes.category}: {categoryValue}</p>
          <h1 className="text-3xl font-semibold text-zinc-900">{item.title}</h1>
          {summary ? (
            <p className="text-base text-zinc-600" aria-label={dictionary.catalog.summaryLabel}>
              {summary}
            </p>
          ) : null}
        </header>
        {item.image ? (
          <Image
            src={item.image.src}
            alt={item.title}
            width={item.image.width ?? 1200}
            height={item.image.height ?? 675}
            className="h-auto w-full rounded-lg object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        ) : null}
        <section className="grid gap-4 md:grid-cols-2">
          <AttributeList label={attributes.process} values={processValues} emptyValue={emptyValue} />
          <AttributeList label={attributes.base} values={baseValues} emptyValue={emptyValue} />
          <AttributeList label={attributes.filler} values={fillerValues} emptyValue={emptyValue} />
          {showAuxiliary ? (
            <AttributeList label={attributes.auxiliary} values={auxiliaryValues} emptyValue={emptyValue} />
          ) : null}
        </section>
        <div className="prose-markdoc">{content}</div>
      </article>
    </SiteShell>
  );
}

type AttributeListProps = {
  label: string;
  values: readonly string[];
  emptyValue: string;
};

function AttributeList({ label, values, emptyValue }: AttributeListProps) {
  const hasValues = Array.isArray(values) && values.length > 0;
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{label}</h3>
      <p className="mt-1 text-sm text-zinc-700">{hasValues ? values.join(', ') : emptyValue}</p>
    </div>
  );
}

function mapAttributeValues<T extends string>(
  values: readonly T[],
  taxonomyKey: 'processes' | 'bases' | 'fillers' | 'auxiliaries',
  locale: Locale
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => {
      if (typeof value !== 'string' || !value.trim()) {
        return null;
      }
      const label = getCatalogTaxonomyLabel(taxonomyKey, value, locale);
      return label ?? value;
    })
    .filter((value): value is string => Boolean(value && value.trim()));
}

export async function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  return getLocalizedCatalogParams();
}

export async function generateMetadata({ params }: CatalogProductPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  return resolveCatalogProductMetadata(rawLocale, slug);
}