import { notFound } from 'next/navigation';

import { CatalogList } from '@/components/catalog/catalog-list';
import { applyFilters, type FilterState } from '@/app/(site)/shared/catalog-filtering';
import { getCatalogListing, getCatalogListingPage } from '@/app/(site)/shared/catalog';
import {
  resolveDetailLabel,
  resolveEmptyState,
  resolveRequestLabel,
} from '@/app/(site)/shared/catalog-page-messages';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { getCatalogTaxonomyOptions, getCatalogTaxonomyValues } from '@/lib/catalog/constants';
import { isLocale, type Locale } from '@/lib/i18n';
import { findTargetLocale, buildPath } from '@/lib/paths';

import { ALLOWED_COATING_BASES, PRODUCT_CATEGORIES } from '../../constants';
import { matchOptionBySlug, toFilter } from '../../helpers';

type PageParams = { locale: Locale; base: string };

type PageProps = { params: Promise<PageParams> };

export default async function CoatingBaseCatalogPage({ params }: PageProps) {
  const { locale: rawLocale, base } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const taxonomyOptions = getCatalogTaxonomyOptions(locale);
  const baseOption = matchOptionBySlug(taxonomyOptions.bases, base);

  if (!baseOption || !ALLOWED_COATING_BASES.includes(baseOption.value)) {
    notFound();
  }

  const [items, shell, catalogPage] = await Promise.all([
    getCatalogListing(locale),
    getSiteShellData(locale),
    getCatalogListingPage(locale),
  ]);

  const taxonomyValues = getCatalogTaxonomyValues();
  const filters: FilterState = {
    category: toFilter([PRODUCT_CATEGORIES.coatings]),
    process: toFilter([]),
    base: toFilter([baseOption.value]),
    filler: toFilter([]),
    metal: toFilter([]),
    auxiliary: toFilter([]),
    q: null,
    sort: 'name',
    limit: 0,
    offset: 0,
  };

  const filteredItems = applyFilters(items, filters, taxonomyValues);
  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['products', 'coatings', base]);
  const currentPath = buildPath(locale, ['products', 'coatings', base]);
  const sectionLabel = locale === 'ru' ? 'Противопригарные покрытия' : 'Foundry coatings';
  const heading = `${sectionLabel} — ${baseOption.label}`;
  const description =
    locale === 'ru'
      ? `Покрытия на основе «${baseOption.label}». Откройте карточку товара, чтобы увидеть спецификацию и документы.`
      : `${baseOption.label} coatings. Open a product card to view specs and documents.`;

  return (
    <SiteShellLayout
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
      currentYear={shell.currentYear}
    >
      <main className="page-shell">
        <section className="container space-y-6 py-10 lg:py-12">
          <SectionHeading as="h1" title={heading} description={description} />

          <CatalogList
            items={filteredItems}
            locale={locale}
            taxonomyOptions={taxonomyOptions}
            emptyStateMessage={resolveEmptyState(catalogPage, locale)}
            detailLabel={resolveDetailLabel(catalogPage, locale)}
            requestLabel={resolveRequestLabel(catalogPage, locale)}
          />
        </section>
      </main>
    </SiteShellLayout>
  );
}