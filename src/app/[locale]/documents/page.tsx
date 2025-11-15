import { Fragment } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import {
  DOCUMENT_TYPES,
  DOCUMENT_LANGUAGES,
  getCatalogItems,
  getDocuments,
  getDocumentsPage,
  getSite,
  type CatalogListItem,
  type Document,
  type DocumentLanguage,
  type DocumentType,
  type DocumentsPageContent,
} from '@/lib/keystatic';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n';
import { buildPath, findTargetLocale } from '@/lib/paths';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';

export const revalidate = 60;

type PageProps = {
  params: { locale: Locale } | Promise<{ locale: Locale }>;
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

type LangFilterValue = DocumentLanguage | 'all';

type FilterState = {
  types: DocumentType[];
  lang: LangFilterValue;
};

const DOCUMENT_TYPE_VALUES = new Set<DocumentType>(Array.from(DOCUMENT_TYPES));
const DOCUMENT_LANGUAGE_VALUES = new Set<DocumentLanguage>(Array.from(DOCUMENT_LANGUAGES));
const LANGUAGE_FILTER_VALUES: readonly LangFilterValue[] = ['all', ...DOCUMENT_LANGUAGES];

export default async function DocumentsPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await Promise.resolve(params);
  const rawSearchParams = await Promise.resolve(searchParams ?? {});

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const filters = parseFilters(rawSearchParams, locale);

  const [documents, pageContent, shell, catalogItems] = await Promise.all([
    getDocuments(),
    getDocumentsPage(),
    getSiteShellData(locale),
    getCatalogItems(locale),
  ]);

  const filteredDocuments = applyFilters(documents, filters);
  const sortedDocuments = sortDocuments(filteredDocuments, locale);
  const catalogLookup = buildCatalogLookup(catalogItems);

  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['documents']);
  const pageTitle = resolvePageTitle(pageContent, locale);
  const pageDescription = resolvePageDescription(pageContent, locale);
  const typeLegendLabel = resolveTypeLegend(pageContent, locale);
  const languageLegendLabel = resolveLanguageLegend(pageContent, locale);
  const applyLabel = resolveApplyButtonLabel(pageContent, locale);
  const resetLabel = resolveResetButtonLabel(pageContent, locale);
  const downloadLabel = resolveDownloadLinkLabel(pageContent, locale);
  const languageAllLabel = resolveAllLanguagesLabel(pageContent, locale);
  const emptyStateMessage = resolveEmptyState(pageContent, locale);
  const relatedProductsLabel = resolveRelatedProductsLabel(pageContent, locale);
  const resultsLabel = resolveResultsLabel(pageContent, locale, sortedDocuments.length);

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
    >
      <div className="space-y-12">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-zinc-900">{pageTitle}</h1>
          {pageDescription ? <p className="text-base text-zinc-600">{pageDescription}</p> : null}
        </header>
        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <form method="get" className="space-y-6">
            <fieldset>
              <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {typeLegendLabel}
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {DOCUMENT_TYPES.map((type) => {
                  const id = `type-${type}`;
                  const label = resolveTypeLabelValue(pageContent, locale, type);
                  return (
                    <label key={type} htmlFor={id} className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        id={id}
                        type="checkbox"
                        name="type"
                        value={type}
                        defaultChecked={filters.types.includes(type)}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {languageLegendLabel}
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {LANGUAGE_FILTER_VALUES.map((value) => {
                  const id = `lang-${value}`;
                  const isAll = value === 'all';
                  const label = isAll
                    ? languageAllLabel
                    : resolveLanguageLabelValue(pageContent, locale, value as DocumentLanguage);
                  return (
                    <label key={value} htmlFor={id} className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        id={id}
                        type="radio"
                        name="lang"
                        value={value}
                        defaultChecked={filters.lang === value}
                        className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {applyLabel}
              </button>
              <Link
                href={buildPath(locale, ['documents'])}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {resetLabel}
              </Link>
            </div>
          </form>
        </section>
        <section className="space-y-6">
          <p className="text-sm text-zinc-500">{resultsLabel}</p>
          {sortedDocuments.length > 0 ? (
            <ul className="space-y-6">
              {sortedDocuments.map((document) => {
                const title = resolveDocumentTitle(document, locale);
                const typeLabel = resolveTypeLabelValue(pageContent, locale, document.type);
                const langLabel = resolveLanguageLabelValue(pageContent, locale, document.lang);
                const fileInfoParts: string[] = [];
                if (document.fileExtension) {
                  fileInfoParts.push(document.fileExtension.toUpperCase());
                }
                if (typeof document.fileSize === 'number' && document.fileSize > 0) {
                  const sizeLabel = formatFileSize(document.fileSize);
                  if (sizeLabel) {
                    fileInfoParts.push(sizeLabel);
                  }
                }
                const downloadSuffix = fileInfoParts.length ? ` (${fileInfoParts.join(', ')})` : '';
                const downloadText = `${downloadLabel} ${typeLabel}${downloadSuffix}`;
                const relatedProducts = resolveRelatedProducts(document, catalogLookup);

                return (
                  <li key={document.id}>
                    <article className="space-y-4 rounded-lg border border-zinc-200 p-6 shadow-sm">
                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
                        <p className="text-sm text-zinc-600">
                          {typeLabel} · {langLabel}
                        </p>
                      </div>
                      {document.file ? (
                        <div>
                          <a
                            href={document.file}
                            download={document.fileName ?? undefined}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                          >
                            {downloadText}
                          </a>
                        </div>
                      ) : null}
                      {relatedProducts.length > 0 ? (
                        <div className="text-sm text-zinc-700">
                          <span className="font-medium">{relatedProductsLabel} </span>
                          <span>
                            {relatedProducts.map((product, index) => {
                              const href = buildPath(locale, ['catalog', product.slug]);
                              return (
                                <Fragment key={product.id}>
                                  {index > 0 ? ', ' : ''}
                                  <Link
                                    href={href}
                                    className="text-blue-600 hover:text-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                                  >
                                    {product.title}
                                  </Link>
                                </Fragment>
                              );
                            })}
                          </span>
                        </div>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600">{emptyStateMessage}</p>
          )}
        </section>
      </div>
    </SiteShell>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await Promise.resolve(params);
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  const [site, documentsPage] = await Promise.all([getSite(locale), getDocumentsPage()]);

  const slugMap: Partial<Record<Locale, string>> = {};
  for (const candidate of locales) {
    slugMap[candidate] = buildPath(candidate, ['documents']);
  }

  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });

  const resolvedTitle = resolvePageTitle(documentsPage, locale);
  const resolvedDescription = resolvePageDescription(documentsPage, locale);
  const ogImageSource = documentsPage?.ogImage ?? site.seo.ogImage ?? null;
  const ogImage = resolveOpenGraphImage(ogImageSource, site.seo.canonicalBase);
  const canonicalUrl = alternates.canonical;
  const alternatesData: Metadata['alternates'] = { languages: alternates.languages };
  if (canonicalUrl) {
    alternatesData.canonical = canonicalUrl;
  }
  const hrefLang = HREFLANG_CODE[locale];
  const preferredUrl = canonicalUrl ?? alternates.languages[hrefLang] ?? buildPath(locale, ['documents']);
  const descriptionForMeta = resolvedDescription ?? undefined;

  return {
    title: resolvedTitle,
    description: descriptionForMeta,
    alternates: alternatesData,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: resolvedTitle,
      description: descriptionForMeta,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      site: site.seo.twitterHandle ?? undefined,
      title: resolvedTitle,
      description: descriptionForMeta,
      images: ogImage ? [ogImage.url] : undefined,
    },
  } satisfies Metadata;
}

function parseFilters(
  rawSearchParams: Record<string, string | string[] | undefined>,
  locale: Locale
): FilterState {
  const defaultLang = DOCUMENT_LANGUAGE_VALUES.has(locale as DocumentLanguage)
    ? (locale as DocumentLanguage)
    : defaultLocale;
  const typeParam = rawSearchParams.type;
  const typeValues = Array.isArray(typeParam) ? typeParam : typeParam ? [typeParam] : [];
  const types: DocumentType[] = [];
  for (const rawValue of typeValues) {
    if (typeof rawValue !== 'string') {
      continue;
    }
    const normalized = rawValue.trim() as DocumentType;
    if (!DOCUMENT_TYPE_VALUES.has(normalized)) {
      continue;
    }
    if (!types.includes(normalized)) {
      types.push(normalized);
    }
  }

  const langParam = rawSearchParams.lang;
  const langValue = Array.isArray(langParam) ? langParam[0] : langParam;
  let lang: LangFilterValue = defaultLang;
  if (typeof langValue === 'string') {
    const trimmed = langValue.trim();
    if (trimmed === 'all') {
      lang = 'all';
    } else if (DOCUMENT_LANGUAGE_VALUES.has(trimmed as DocumentLanguage)) {
      lang = trimmed as DocumentLanguage;
    }
  }

  return { types, lang } satisfies FilterState;
}

function applyFilters(documents: Document[], filters: FilterState): Document[] {
  return documents.filter((document) => {
    if (filters.types.length > 0 && !filters.types.includes(document.type)) {
      return false;
    }
    if (filters.lang !== 'all' && document.lang !== filters.lang) {
      return false;
    }
    return true;
  });
}

function sortDocuments(documents: Document[], locale: Locale): Document[] {
  const collator = new Intl.Collator(locale === 'ru' ? 'ru' : 'en', { sensitivity: 'base' });
  const orderMap = new Map<DocumentType, number>(DOCUMENT_TYPES.map((type, index) => [type, index]));
  return [...documents].sort((a, b) => {
    const orderA = orderMap.get(a.type) ?? 0;
    const orderB = orderMap.get(b.type) ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const titleA = resolveDocumentTitle(a, locale);
    const titleB = resolveDocumentTitle(b, locale);
    const comparison = collator.compare(titleA, titleB);
    if (comparison !== 0) {
      return comparison;
    }
    const idComparison = a.id.localeCompare(b.id);
    if (idComparison !== 0) {
      return idComparison;
    }
    return (a.fileName ?? '').localeCompare(b.fileName ?? '');
  });
}

function resolveDocumentTitle(document: Document, locale: Locale): string {
  const localized = document.title[locale];
  if (localized && localized.trim()) {
    return localized;
  }
  const fallback = document.title[defaultLocale];
  if (fallback && fallback.trim()) {
    return fallback;
  }
  for (const candidate of locales) {
    const value = document.title[candidate];
    if (value && value.trim()) {
      return value;
    }
  }
  return document.fileName ?? document.id;
}

function resolveLocalizedValue(
  record: Partial<Record<Locale, string>> | null | undefined,
  locale: Locale
): string {
  const localized = record?.[locale];
  if (localized && localized.trim()) {
    return localized;
  }
  const fallback = record?.[defaultLocale];
  if (fallback && fallback.trim()) {
    return fallback;
  }
  for (const candidate of locales) {
    const value = record?.[candidate];
    if (value && value.trim()) {
      return value;
    }
  }
  return '';
}

function resolveTypeLegend(page: DocumentsPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.typeFilterLabel ?? null, locale);
}

function resolveLanguageLegend(page: DocumentsPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.languageFilterLabel ?? null, locale);
}

function resolveApplyButtonLabel(page: DocumentsPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.applyLabel ?? null, locale);
}

function resolveResetButtonLabel(page: DocumentsPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.resetLabel ?? null, locale);
}

function resolveDownloadLinkLabel(page: DocumentsPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.downloadLabel ?? null, locale);
}

function resolveAllLanguagesLabel(page: DocumentsPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.allLanguagesLabel ?? null, locale);
}

function resolveEmptyState(page: DocumentsPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.emptyStateMessage ?? null, locale);
}

function resolveRelatedProductsLabel(page: DocumentsPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.relatedProductsLabel ?? null, locale);
}

function resolveTypeLabelValue(page: DocumentsPageContent | null, locale: Locale, type: DocumentType): string {
  return resolveLocalizedValue(page?.typeLabels?.[type] ?? null, locale);
}

function resolveLanguageLabelValue(
  page: DocumentsPageContent | null,
  locale: Locale,
  lang: DocumentLanguage
): string {
  return resolveLocalizedValue(page?.languageLabels?.[lang] ?? null, locale);
}

function resolveResultsLabel(
  page: DocumentsPageContent | null,
  locale: Locale,
  count: number
): string {
  const template = resolveLocalizedValue(page?.resultsLabelTemplate ?? null, locale);
  return template.length ? template.replace('{count}', String(count)) : '';
}

function buildCatalogLookup(items: CatalogListItem[]): Map<string, CatalogListItem> {
  const map = new Map<string, CatalogListItem>();
  for (const item of items) {
    map.set(item.id, item);
    map.set(item.slug, item);
    for (const value of Object.values(item.slugByLocale)) {
      if (value) {
        map.set(value, item);
      }
    }
  }
  return map;
}

function resolveRelatedProducts(document: Document, lookup: Map<string, CatalogListItem>): CatalogListItem[] {
  const related: CatalogListItem[] = [];
  const seen = new Set<string>();
  for (const key of document.relatedProductIds) {
    const normalized = key.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    const product = lookup.get(normalized);
    if (!product || related.some((item) => item.id === product.id)) {
      continue;
    }
    related.push(product);
  }
  return related;
}

function resolvePageTitle(page: DocumentsPageContent | null, locale: Locale): string {
  const localized = page?.title?.[locale];
  if (localized && localized.trim()) {
    return localized;
  }
  const fallback = page?.title?.[defaultLocale];
  if (fallback && fallback.trim()) {
    return fallback;
  }
  for (const candidate of locales) {
    const value = page?.title?.[candidate];
    if (value && value.trim()) {
      return value;
    }
  }
  return '';
}

function resolvePageDescription(page: DocumentsPageContent | null, locale: Locale): string | null {
  const localized = page?.description?.[locale];
  if (localized && localized.trim()) {
    return localized;
  }
  const fallback = page?.description?.[defaultLocale];
  if (fallback && fallback.trim()) {
    return fallback;
  }
  for (const candidate of locales) {
    const value = page?.description?.[candidate];
    if (value && value.trim()) {
      return value;
    }
  }
  return null;
}

function formatFileSize(bytes: number | null): string | null {
  if (bytes === null || bytes === undefined) {
    return null;
  }
  if (bytes === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const formatted = size >= 10 || unitIndex === 0 ? Math.round(size).toString() : size.toFixed(1);
  return `${formatted.replace(/\.0$/, '')} ${units[unitIndex]}`;
}