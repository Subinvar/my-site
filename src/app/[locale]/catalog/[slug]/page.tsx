import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  AUXILIARY_CATEGORY,
  getCatalogProductPage,
  getCatalogTaxonomyLabel,
  getLocalizedCatalogParams,
  resolveCatalogProductMetadata,
} from '@/app/(site)/shared/catalog';
import { PRODUCT_CATEGORIES } from '@/app/[locale]/products/constants';
import { toSlug } from '@/app/[locale]/products/helpers';
import Link from 'next/link';

import { Breadcrumbs } from '@/app/(site)/shared/ui/breadcrumbs';
import { Button } from '@/app/(site)/shared/ui/button';
import { getInterfaceDictionary } from '@/content/dictionary';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, switchLocalePath, buildPath } from '@/lib/paths';
import { isLocale, type Locale } from '@/lib/i18n';
import type { CatalogItem, CatalogBadge } from '@/lib/keystatic';

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

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
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
              {content}
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

              {item.documents.length ? (
                <section className="rounded-xl border bg-card p-4 shadow-sm">
                  <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Документация</h2>
                  <div className="mt-3 flex flex-col gap-2">
                    {item.documents.map((doc) => (
                      <a
                        key={doc.slug}
                        href={doc.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                      >
                        <span>
                          {resolveDocumentTypeLabel(doc.type, locale)}
                        </span>
                        <span className="text-xs text-muted-foreground">PDF</span>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>
          </div>

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

function resolveBadge(badge: CatalogBadge, locale: Locale) {
  if (badge === 'none') {
    return null;
  }

  const labelMap: Record<Exclude<CatalogBadge, 'none'>, { ru: string; en: string }> = {
    bestseller: { ru: 'Хит продаж', en: 'Bestseller' },
    premium: { ru: 'Премиум', en: 'Premium' },
    eco: { ru: 'Eco', en: 'Eco' },
    special: { ru: 'Спец.решение', en: 'Special' },
  };

  const classMap: Record<Exclude<CatalogBadge, 'none'>, string> = {
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

function ProductBadge({ badge, locale }: { badge?: CatalogBadge; locale: Locale }) {
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