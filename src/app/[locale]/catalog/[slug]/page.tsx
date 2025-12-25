import Markdoc, { Node as MarkdocAstNode } from '@markdoc/markdoc';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';

import {
  AUXILIARY_CATEGORY,
  getCatalogProductPage,
  getCatalogTaxonomyLabel,
  getLocalizedCatalogParams,
  resolveCatalogProductMetadata,
} from '@/app/(site)/shared/catalog';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { Breadcrumbs } from '@/app/(site)/shared/ui/breadcrumbs';
import { Button } from '@/app/(site)/shared/ui/button';
import { PRODUCT_CATEGORIES } from '@/app/[locale]/products/constants';
import { toSlug } from '@/app/[locale]/products/helpers';
import { getInterfaceDictionary } from '@/content/dictionary';
import { isLocale, type Locale } from '@/lib/i18n';
import type { CatalogBadge, CatalogItem, CatalogVariant } from '@/lib/keystatic';
import { config as markdocConfig, createComponents, toMarkdocAst } from '@/lib/markdoc';
import { buildPath, findTargetLocale, switchLocalePath } from '@/lib/paths';

const TAXONOMY_KEYS = {
  category: 'categories',
  process: 'processes',
  base: 'bases',
  filler: 'fillers',
  metal: 'metals',
  auxiliary: 'auxiliaries',
} as const;

type CatalogProductParams = { locale: Locale; slug: string };

type CatalogProductPageProps = {
  params: Promise<CatalogProductParams>;
};

type ProductDirectionCategories = Record<
  keyof typeof PRODUCT_CATEGORIES,
  { title: string }
>;

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

  const { item, summary } = data;
  const targetLocale = findTargetLocale(locale);
  const switcherHref = switchLocalePath(locale, targetLocale, {
    collection: 'catalog',
    slugs: item.slugByLocale,
  });
  const currentPath = buildPath(locale, ['catalog', slug]);
  const dictionary = getInterfaceDictionary(locale);
  const attributes = dictionary.catalog.attributes;
  const emptyValue = dictionary.common.emptyValue;
  const catalogLabel = locale === 'ru' ? 'Каталог' : 'Catalog';
  const productsLabel = locale === 'ru' ? 'Продукция' : 'Products';
  const homeLabel = locale === 'ru' ? 'Главная' : 'Home';
  const categoryLabel = resolveSingleValue(
    item.category,
    TAXONOMY_KEYS.category,
    locale,
    emptyValue,
  );
  const categoryChipLabel = categoryLabel === emptyValue ? null : categoryLabel;
  const processLabels = mapAttributeValues(item.process, TAXONOMY_KEYS.process, locale);
  const processValue = formatValues(processLabels);
  const baseValue = formatValues(mapAttributeValues(item.base, TAXONOMY_KEYS.base, locale));
  const fillerValue = formatValues(mapAttributeValues(item.filler, TAXONOMY_KEYS.filler, locale));
  const metalValue = formatValues(mapAttributeValues(item.metals, TAXONOMY_KEYS.metal, locale));
  const auxiliaryValue = formatValues(mapAttributeValues(item.auxiliary, TAXONOMY_KEYS.auxiliary, locale));
  const showAuxiliary = item.category === AUXILIARY_CATEGORY && Boolean(auxiliaryValue);
  const contactHref = `${buildPath(locale, ['contacts'])}?product=${encodeURIComponent(item.title)}`;
  const leadText = item.shortDescription ?? summary;
  const sectionBreadcrumb = resolveSectionBreadcrumb(
    item.category,
    locale,
    dictionary.productDirections.categories,
  );
  const typeBreadcrumb = resolveTypeBreadcrumb(item, locale);
  const variantsLabel = locale === 'ru' ? 'Другие марки в серии' : 'Other grades in series';
  const renderedContent = await renderCatalogContent({
    item,
    locale,
    variantsLabel,
  });

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
      currentYear={shell.currentYear}
    >
      <main id="main" className="page-shell">
        <div className="container py-8 lg:py-10 space-y-8">
          <nav className="text-xs text-muted-foreground">
            <Breadcrumbs
              items={[
                { label: homeLabel, href: buildPath(locale) },
                { label: productsLabel, href: buildPath(locale, ['products']) },
                sectionBreadcrumb,
                typeBreadcrumb,
                !sectionBreadcrumb && item.category
                  ? {
                      label: catalogLabel,
                      href: `${buildPath(locale, ['catalog'])}?category=${encodeURIComponent(item.category)}`,
                    }
                  : null,
                !sectionBreadcrumb && categoryLabel && item.category
                  ? {
                      label: categoryLabel,
                      href: `${buildPath(locale, ['catalog'])}?category=${encodeURIComponent(item.category)}`,
                    }
                  : null,
                { label: item.title },
              ].filter(Boolean) as { label: string; href?: string }[]}
            />
          </nav>

          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h1>

            {leadText ? (
              <p className="max-w-3xl text-base text-muted-foreground">{leadText}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <ProductBadge badge={item.badge} locale={locale} />
              <ProcessChip process={processLabels[0]} />
              <CategoryChip category={categoryChipLabel} />
            </div>
          </header>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <article className="prose prose-sm max-w-none lg:prose-base dark:prose-invert prose-headings:font-semibold prose-a:text-[var(--color-brand-700)] prose-strong:text-[var(--foreground)]">
              {renderedContent}
            </article>

            <aside className="space-y-6">
              <section className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  {locale === 'ru' ? 'Характеристики' : 'Specifications'}
                </h2>
                <div className="mt-3 space-y-3 text-sm">
                  <ParamRow label={attributes.category} value={categoryLabel} />
                  <ParamRow label={attributes.process} value={processValue} />
                  <ParamRow label={attributes.base} value={baseValue} />
                  <ParamRow label={attributes.filler} value={fillerValue} />
                  <ParamRow label={attributes.metal} value={metalValue} />
                  {showAuxiliary ? (
                    <ParamRow label={attributes.auxiliary} value={auxiliaryValue} />
                  ) : null}
                </div>
              </section>

            </aside>
          </div>

          {item.documents.length ? (
            <section className="rounded-2xl border bg-card/70 px-4 py-5 shadow-sm">
              <h2 className="text-lg font-semibold">{locale === 'ru' ? 'Документация' : 'Documentation'}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {item.documents.map((doc) => (
                  <li key={doc.slug}>
                    <a
                      href={doc.file}
                      className="inline-flex items-center gap-2 text-[15px] font-medium text-[var(--color-brand-700)] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span aria-hidden>📄</span>
                      <span>{buildDocumentLinkText(doc, locale)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <footer className="border-t pt-6 mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Button asChild size="lg">
              <Link href={contactHref}>Запросить предложение</Link>
            </Button>

            <p className="text-sm text-muted-foreground">
              Свяжитесь с нами, чтобы подобрать оптимальный режим применения {item.title}.
            </p>
          </footer>
        </div>
      </main>
    </SiteShell>
  );
}

function ParamRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

async function renderCatalogContent({
  item,
  locale,
  variantsLabel,
}: {
  item: CatalogItem;
  locale: Locale;
  variantsLabel: string;
}) {
  const ast = toMarkdocAst(item.content);

  if (!ast) {
    return null;
  }

  const withVariants = injectVariantBlock(ast, {
    item,
    locale,
    label: variantsLabel,
  });

  const transformed = Markdoc.transform(withVariants, {
    ...markdocConfig,
    tags: {
      ...markdocConfig.tags,
      variantLineup: { render: 'VariantLineup' },
    },
  });

  return Markdoc.renderers.react(transformed, React, {
    components: {
      ...createComponents(locale),
      VariantLineup: ({
        description,
        variants,
      }: {
        description?: string | null;
        variants: CatalogVariant[];
      }) => {
        if (!description && !variants.length) {
          return null;
        }

        const alsoAvailableLabel = locale === 'ru' ? 'Также доступны:' : 'Also available:';

        return (
          <section className="not-prose my-6 rounded-xl border bg-card/60 p-4 shadow-sm">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{variantsLabel}</h2>
            {description ? (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
            ) : null}

            {variants.length ? (
              <div className="mt-3 space-y-2 text-sm font-medium">
                <p className="text-muted-foreground">{alsoAvailableLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <Link
                      key={variant.id}
                      href={buildPath(locale, ['catalog', variant.slug])}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-foreground hover:border-brand-600 hover:text-brand-700"
                    >
                      <span>{variant.title}</span>
                      <span aria-hidden className="text-xs text-muted-foreground">
                        ↗
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        );
      },
    },
  });
}

function injectVariantBlock(ast: MarkdocAstNode, config: { item: CatalogItem; locale: Locale; label: string }) {
  const { item, locale, label } = config;
  if (!item.seriesDescription && !item.variants.length) {
    return ast;
  }

  const children = Array.isArray(ast.children) ? [...ast.children] : [];
  const preferredIndex = findVariantInsertionIndex(children, locale);
  const variantTag = new MarkdocAstNode(
    'tag',
    {
      description: item.seriesDescription,
      variants: item.variants,
      label,
    },
    [],
    'variantLineup',
  );

  const insertionIndex = Math.max(0, Math.min(preferredIndex ?? children.length, children.length));
  children.splice(insertionIndex, 0, variantTag);

  ast.children = children;
  return ast;
}

function findVariantInsertionIndex(children: Array<MarkdocAstNode | string>, locale: Locale) {
  const sectionTargets = [
    locale === 'ru' ? 'Назначение' : 'Purpose',
    locale === 'ru' ? 'Преимущества' : 'Benefits',
  ];

  const headingIndexes = children
    .map((child, index) => ({
      index,
      level: getHeadingLevel(child),
      title: getHeadingTitle(child),
    }))
    .filter((entry) => entry.level && entry.title) as Array<{
    index: number;
    level: number;
    title: string;
  }>;

  for (const target of sectionTargets) {
    const section = headingIndexes.find(({ title }) => title.toLowerCase() === target.toLowerCase());
    if (!section) continue;

    const nextSiblingIndex = headingIndexes.find(
      ({ index, level }) => index > section.index && level <= (section.level ?? 2),
    )?.index;

    return nextSiblingIndex ?? children.length;
  }

  return children.length;
}

function getHeadingLevel(node: MarkdocAstNode | string): number | null {
  if (typeof node === 'string') {
    return null;
  }

  if (node.type === 'heading' && typeof node.attributes?.level === 'number') {
    return node.attributes.level;
  }
  return null;
}

function getHeadingTitle(node: MarkdocAstNode | string): string | null {
  if (typeof node === 'string' || node.type !== 'heading' || !Array.isArray(node.children)) {
    return null;
  }

  const text = node.children.map(extractTextContent).join('').trim();

  return text || null;
}

function extractTextContent(node: unknown): string {
  if (typeof node === 'string') {
    return node;
  }

  if (typeof node === 'object' && node !== null) {
    const tagNode = node as { attributes?: { content?: unknown }; children?: unknown[] };
    if (typeof tagNode.attributes?.content === 'string') {
      return tagNode.attributes.content;
    }

    if (Array.isArray(tagNode.children)) {
      return tagNode.children.map(extractTextContent).join('');
    }
  }

  return '';
}

function mapAttributeValues<T extends string>(
  values: readonly T[] | null | undefined,
  taxonomyKey: (typeof TAXONOMY_KEYS)[keyof typeof TAXONOMY_KEYS],
  locale: Locale,
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

function resolveSingleValue(
  value: string | null,
  taxonomyKey: (typeof TAXONOMY_KEYS)[keyof typeof TAXONOMY_KEYS],
  locale: Locale,
  emptyValue: string,
): string {
  if (!value) return emptyValue;
  const label = getCatalogTaxonomyLabel(taxonomyKey, value, locale);
  return label ?? value;
}

function formatValues(values: string[]): string | null {
  if (!values.length) return null;
  return values.join(', ');
}

function buildDocumentLinkText(
  doc: CatalogItem['documents'][number],
  locale: Locale,
): string {
  const label = doc.title || resolveDocumentTypeLabel(doc.type, locale) || doc.slug;
  const prefix = locale === 'ru' ? 'Скачать ' : 'Download ';
  return `${prefix}${label}`;
}

function resolveDocumentTypeLabel(type: CatalogItem['documents'][number]['type'], locale: Locale): string {
  const map: Record<CatalogItem['documents'][number]['type'], { ru: string; en: string }> = {
    certificate: { ru: 'Сертификат', en: 'Certificate' },
    tds: { ru: 'ТДС', en: 'TDS' },
    msds: { ru: 'МСДС', en: 'MSDS' },
    brochure: { ru: 'Брошюра', en: 'Brochure' },
  };

  const labels = map[type];
  if (!labels) return type;
  return locale === 'ru' ? labels.ru : labels.en;
}

function resolveBadge(badge: CatalogBadge | null, locale: Locale) {
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

  const label = locale === 'ru' ? labelMap[badge].ru : labelMap[badge].en;
  return { label, className: classMap[badge] };
}

function resolveSectionBreadcrumb(
  category: CatalogItem['category'],
  locale: Locale,
  dictionaryCategories: ProductDirectionCategories,
): { label: string; href: string } | null {
  if (!category) {
    return null;
  }

  const matchedEntry = (Object.entries(PRODUCT_CATEGORIES) as Array<
    [keyof typeof PRODUCT_CATEGORIES, string]
  >).find(([, value]) => value === category);

  if (!matchedEntry) {
    return null;
  }

  const [categoryKey] = matchedEntry;
  const label =
    dictionaryCategories[categoryKey]?.title ??
    getCatalogTaxonomyLabel(TAXONOMY_KEYS.category, category, locale) ??
    category;

  return {
    label,
    href: buildPath(locale, ['products', categoryKey]),
  };
}

function resolveTypeBreadcrumb(
  item: CatalogItem,
  locale: Locale,
): { label: string; href: string } | null {
  if (item.category === PRODUCT_CATEGORIES.binders) {
    const processValue = item.process?.[0];
    if (!processValue) {
      return null;
    }

    const label = getCatalogTaxonomyLabel(TAXONOMY_KEYS.process, processValue, locale) ?? processValue;
    return { label, href: buildPath(locale, ['products', 'binders', toSlug(processValue)]) };
  }

  if (item.category === PRODUCT_CATEGORIES.coatings) {
    const baseValue = item.base?.[0];
    if (!baseValue) {
      return null;
    }

    const label = getCatalogTaxonomyLabel(TAXONOMY_KEYS.base, baseValue, locale) ?? baseValue;
    return { label, href: buildPath(locale, ['products', 'coatings', toSlug(baseValue)]) };
  }

  if (item.category === PRODUCT_CATEGORIES.auxiliaries) {
    const auxiliaryValue = item.auxiliary?.[0];
    if (!auxiliaryValue) {
      return null;
    }

    const label =
      getCatalogTaxonomyLabel(TAXONOMY_KEYS.auxiliary, auxiliaryValue, locale) ?? auxiliaryValue;
    return { label, href: buildPath(locale, ['products', 'auxiliaries', toSlug(auxiliaryValue)]) };
  }

  return null;
}

function ProductBadge({ badge, locale }: { badge?: CatalogBadge | null; locale: Locale }) {
  const badgeData = badge ? resolveBadge(badge, locale) : null;
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

function ProcessChip({ process }: { process?: string }) {
  if (!process) {
    return null;
  }

  const label =
    process === 'alpha-set'
      ? 'Alpha-set'
      : process === 'furan'
        ? 'Фуран'
        : process;

  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}

function CategoryChip({ category }: { category?: string | null }) {
  if (!category) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
      {category}
    </span>
  );
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