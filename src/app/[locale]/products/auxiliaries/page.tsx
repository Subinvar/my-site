import { notFound } from 'next/navigation';

import { ProductCategoryCard } from '@/app/(site)/shared/ui/product-category-card';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { getInterfaceDictionary } from '@/content/dictionary';
import { getCatalogTaxonomyOptions } from '@/lib/catalog/constants';
import { isLocale, type Locale } from '@/lib/i18n';
import { findTargetLocale, buildPath } from '@/lib/paths';

import { ALLOWED_AUXILIARIES } from '../constants';
import { sortByOrderAndLabel, toSlug } from '../helpers';

type PageParams = { locale: Locale };

type PageProps = { params: Promise<PageParams> };

export default async function AuxiliaryTypesPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const shell = await getSiteShellData(locale);
  const taxonomyOptions = getCatalogTaxonomyOptions(locale);
  const dictionary = getInterfaceDictionary(locale);
  const targetLocale = findTargetLocale(locale);
  const pageTitle = dictionary.productDirections.categories.auxiliaries.title;
  const pageDescription =
    locale === 'ru'
      ? 'Выберите тип вспомогательных материалов, чтобы перейти к товарам.'
      : 'Pick an auxiliary material type to see available products.';
  const cardDescriptionPrefix =
    locale === 'ru'
      ? 'Материалы типа'
      : 'Products in the';
  const ctaLabel = locale === 'ru' ? 'Смотреть товары' : 'View products';

  const cards = taxonomyOptions.auxiliaries
    .filter((option) => ALLOWED_AUXILIARIES.includes(option.value))
    .sort(sortByOrderAndLabel)
    .map((option) => ({
      title: option.label,
      description: `${cardDescriptionPrefix} «${option.label}».`,
      href: buildPath(locale, ['products', 'auxiliaries', toSlug(option.value)]),
      ctaLabel,
    }));

  return (
    <SiteShellLayout
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={buildPath(targetLocale, ['products', 'auxiliaries'])}
      currentPath={buildPath(locale, ['products', 'auxiliaries'])}
      currentYear={shell.currentYear}
    >
      <main className="page-shell">
        <section className="container space-y-6 py-10 lg:py-12">
          <SectionHeading as="h1" title={pageTitle} description={pageDescription} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <ProductCategoryCard key={card.href} {...card} />
            ))}
          </div>
        </section>
      </main>
    </SiteShellLayout>
  );
}
