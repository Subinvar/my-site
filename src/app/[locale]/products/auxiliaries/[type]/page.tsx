import { notFound } from 'next/navigation';

import { CatalogList } from '@/components/catalog/catalog-list';
import { applyFilters, type FilterState } from '@/app/(site)/shared/catalog-filtering';
import { getCatalogListing, getCatalogListingPage } from '@/app/(site)/shared/catalog';
import {
  resolveDetailLabel,
  resolveEmptyState,
  resolveRequestLabel,
} from '@/app/(site)/shared/catalog-page-messages';
import { Breadcrumbs } from '@/app/(site)/shared/ui/breadcrumbs';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { getCatalogTaxonomyOptions, getCatalogTaxonomyValues } from '@/lib/catalog/constants';
import { isLocale, type Locale } from '@/lib/i18n';
import { findTargetLocale, buildPath } from '@/lib/paths';

import { ALLOWED_AUXILIARIES, PRODUCT_CATEGORIES } from '../../constants';
import { matchOptionBySlug, toFilter } from '../../helpers';

type PageParams = { locale: Locale; type: string };

type PageProps = { params: Promise<PageParams> };

export default async function AuxiliaryTypeCatalogPage({ params }: PageProps) {
  const { locale: rawLocale, type } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const taxonomyOptions = getCatalogTaxonomyOptions(locale);
  const auxiliaryOption = matchOptionBySlug(taxonomyOptions.auxiliaries, type);

  if (!auxiliaryOption || !ALLOWED_AUXILIARIES.includes(auxiliaryOption.value)) {
    notFound();
  }

  const [items, shell, catalogPage] = await Promise.all([
    getCatalogListing(locale),
    getSiteShellData(locale),
    getCatalogListingPage(locale),
  ]);

  const taxonomyValues = getCatalogTaxonomyValues();
  const filters: FilterState = {
    category: toFilter([PRODUCT_CATEGORIES.auxiliaries]),
    process: toFilter([]),
    base: toFilter([]),
    filler: toFilter([]),
    metal: toFilter([]),
    auxiliary: toFilter([auxiliaryOption.value]),
    q: null,
    sort: 'name',
    limit: 0,
    offset: 0,
  };

  const filteredItems = applyFilters(items, filters, taxonomyValues);
  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['products', 'auxiliaries', type]);
  const currentPath = buildPath(locale, ['products', 'auxiliaries', type]);
  const homeLabel = locale === 'ru' ? 'Главная' : 'Home';
  const productsLabel = locale === 'ru' ? 'Продукция' : 'Products';
  const sectionLabel = locale === 'ru' ? 'Вспомогательные материалы' : 'Auxiliary materials';
  const heading = `${sectionLabel} — ${auxiliaryOption.label}`;
  const description =
    locale === 'ru'
      ? `Материалы типа «${auxiliaryOption.label}». Откройте карточку товара, чтобы увидеть характеристики и документы.`
      : `${auxiliaryOption.label} products. Open a product card to view specs and documents.`;

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
      <main className="page-shell">
        <section className="container space-y-6 py-10 lg:py-12">
          <Breadcrumbs
            items={[
              { label: homeLabel, href: buildPath(locale) },
              { label: productsLabel, href: buildPath(locale, ['products']) },
              { label: sectionLabel, href: buildPath(locale, ['products', 'auxiliaries']) },
              { label: auxiliaryOption.label },
            ]}
          />

          <SectionHeading title={heading} description={description} />

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
    </SiteShell>
  );
}