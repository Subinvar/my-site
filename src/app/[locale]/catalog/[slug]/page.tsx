import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  AUXILIARY_CATEGORY,
  getCatalogProductPage,
  getCatalogTaxonomyLabel,
  getLocalizedCatalogParams,
  resolveCatalogProductMetadata,
} from '@/app/(site)/shared/catalog';
import { Breadcrumbs } from '@/app/(site)/shared/ui/breadcrumbs';
import { Card, CardHeader, CardTitle } from '@/app/(site)/shared/ui/card';
import { Button } from '@/app/(site)/shared/ui/button';
import { getInterfaceDictionary } from '@/content/dictionary';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, switchLocalePath, buildPath } from '@/lib/paths';
import { isLocale, type Locale } from '@/lib/i18n';
import { getDocuments, type Document } from '@/lib/keystatic';

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

export default async function CatalogProductPage({ params }: CatalogProductPageProps) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [data, shell, documents] = await Promise.all([
    getCatalogProductPage(locale, slug),
    getSiteShellData(locale),
    getDocuments(),
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
  const homeLabel = locale === 'ru' ? 'Главная' : 'Home';
  const categoryLabel = resolveSingleValue(
    item.category,
    TAXONOMY_KEYS.category,
    locale,
    emptyValue,
  );
  const processValue = formatValues(mapAttributeValues(item.process, TAXONOMY_KEYS.process, locale));
  const baseValue = formatValues(mapAttributeValues(item.base, TAXONOMY_KEYS.base, locale));
  const fillerValue = formatValues(
    mapAttributeValues(item.filler, TAXONOMY_KEYS.filler, locale),
  );
  const metalValue = formatValues(mapAttributeValues(item.metals, TAXONOMY_KEYS.metal, locale));
  const auxiliaryValue = formatValues(
    mapAttributeValues(item.auxiliary, TAXONOMY_KEYS.auxiliary, locale),
  );
  const showAuxiliary = item.category === AUXILIARY_CATEGORY && Boolean(auxiliaryValue);
  const relatedDocuments = resolveRelatedDocuments(documents, item.id, locale);
  const contactHref = `${buildPath(locale, ['contacts'])}?product=${encodeURIComponent(item.slug)}`;

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
    >
      <main className="page-shell">
        <section className="container py-10 lg:py-12">
          <nav className="mb-4 text-xs text-muted-foreground">
            <Breadcrumbs
              items={[
                { label: homeLabel, href: buildPath(locale) },
                { label: catalogLabel, href: buildPath(locale, ['catalog']) },
                categoryLabel && item.category
                  ? {
                      label: categoryLabel,
                      href: `${buildPath(locale, ['catalog'])}?category=${encodeURIComponent(item.category)}`,
                    }
                  : null,
                { label: item.title },
              ].filter(Boolean) as { label: string; href?: string }[]}
            />
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <header className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  {attributes.category}: {categoryLabel}
                </p>
                <h1 className="page-title text-2xl">{item.title}</h1>
                {summary ? <p className="page-subtitle">{summary}</p> : null}
              </header>

              <section className="card">
                <div className="card-body space-y-3 text-sm">
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

              {content ? (
                <section className="prose prose-sm max-w-none lg:prose-base prose-headings:font-semibold prose-a:text-[var(--color-brand-700)] prose-strong:text-[var(--foreground)]">
                  {content}
                </section>
              ) : null}
            </div>

            <aside className="space-y-4">
              <Card>
                <CardHeader className="mb-2">
                  <CardTitle className="text-sm font-semibold">Связаться по продукту</CardTitle>
                </CardHeader>
                <p className="text-xs text-muted-foreground">
                  Оставьте заявку, и мы подберём оптимальный режим применения {item.title}.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <Button asChild className="w-full">
                    <a href={contactHref}>Оставить заявку</a>
                  </Button>
                  <Button asChild variant="ghost" className="w-full text-sm">
                    <a href="tel:+74953572550">Позвонить: +7 (495) 357-25-50</a>
                  </Button>
                </div>
              </Card>

              {relatedDocuments.length ? (
                <Card>
                  <CardHeader className="mb-1">
                    <CardTitle className="text-sm font-semibold">Документы</CardTitle>
                  </CardHeader>
                  <div className="space-y-2 text-sm">
                    <ul className="space-y-1">
                      {relatedDocuments.map((doc) => (
                        <li key={doc.id} className="flex flex-col">
                          <a href={doc.href} className="link" target="_blank" rel="noreferrer">
                            {doc.title}
                          </a>
                          {doc.meta ? (
                            <span className="text-xs text-muted-foreground">{doc.meta}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ) : null}
            </aside>
          </div>
        </section>
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

function resolveRelatedDocuments(documents: Document[], productId: string, locale: Locale) {
  return documents
    .filter((doc) => Array.isArray(doc.relatedProductIds) && doc.relatedProductIds.includes(productId))
    .map((doc) => {
      const title = resolveDocumentTitle(doc, locale);
      const metaParts: string[] = [];
      if (doc.fileExtension) {
        metaParts.push(doc.fileExtension.toUpperCase());
      }
      if (typeof doc.fileSize === 'number' && doc.fileSize > 0) {
        metaParts.push(formatFileSize(doc.fileSize));
      }
      if (!doc.file) {
        return null;
      }
      return {
        id: doc.id,
        title,
        href: doc.file,
        meta: metaParts.filter(Boolean).join(' • '),
      };
    })
    .filter((doc): doc is { id: string; title: string; href: string; meta: string } => Boolean(doc && doc.href && doc.title));
}

function resolveDocumentTitle(document: Document, locale: Locale): string {
  const localized = document.title[locale];
  if (localized && localized.trim()) {
    return localized;
  }
  const fallback = document.title[locale === 'ru' ? 'en' : 'ru'];
  if (fallback && fallback.trim()) {
    return fallback;
  }
  return document.fileName ?? document.id;
}

function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return '';
  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(0)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
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