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

import { ALLOWED_BINDER_PROCESSES, PRODUCT_CATEGORIES } from '../../constants';
import { matchOptionBySlug, toFilter } from '../../helpers';

type PageParams = { locale: Locale; process: string };

type PageProps = { params: Promise<PageParams> };

export default async function BinderProcessCatalogPage({ params }: PageProps) {
  const { locale: rawLocale, process } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const taxonomyOptions = getCatalogTaxonomyOptions(locale);
  const processOption = matchOptionBySlug(taxonomyOptions.processes, process);

  if (!processOption || !ALLOWED_BINDER_PROCESSES.includes(processOption.value)) {
    notFound();
  }

  const [items, shell, catalogPage] = await Promise.all([
    getCatalogListing(locale),
    getSiteShellData(locale),
    getCatalogListingPage(locale),
  ]);

  const taxonomyValues = getCatalogTaxonomyValues();
  const filters: FilterState = {
    category: toFilter([PRODUCT_CATEGORIES.binders]),
    process: toFilter([processOption.value]),
    base: toFilter([]),
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
  const switcherHref = buildPath(targetLocale, ['products', 'binders', process]);
  const currentPath = buildPath(locale, ['products', 'binders', process]);
  const homeLabel = locale === 'ru' ? 'Главная' : 'Home';
  const productsLabel = locale === 'ru' ? 'Продукция' : 'Products';
  const sectionLabel = locale === 'ru' ? 'Связующие' : 'Binders';
  const heading = `${sectionLabel} — ${processOption.label}`;
  const description =
    locale === 'ru'
      ? `Связующие для процесса «${processOption.label}». Откройте карточку товара, чтобы увидеть спецификацию и документы.`
      : `${processOption.label} binders. Open a product card to view specs and documents.`;

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
              { label: sectionLabel, href: buildPath(locale, ['products', 'binders']) },
              { label: processOption.label },
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