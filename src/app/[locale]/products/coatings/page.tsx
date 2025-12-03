import { notFound } from 'next/navigation';

import { ProductCategoryCard } from '@/app/(site)/shared/ui/product-category-card';
import { Breadcrumbs } from '@/app/(site)/shared/ui/breadcrumbs';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { getInterfaceDictionary } from '@/content/dictionary';
import { getCatalogTaxonomyOptions } from '@/lib/catalog/constants';
import { isLocale, type Locale } from '@/lib/i18n';
import { findTargetLocale, buildPath } from '@/lib/paths';

import { ALLOWED_COATING_BASES } from '../constants';
import { sortByOrderAndLabel, toSlug } from '../helpers';

type PageParams = { locale: Locale };

type PageProps = { params: PageParams };

export default async function CoatingTypesPage({ params }: PageProps) {
  const { locale: rawLocale } = params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [shell, taxonomyOptions] = await Promise.all([
    getSiteShellData(locale),
    Promise.resolve(getCatalogTaxonomyOptions(locale)),
  ]);
  const dictionary = getInterfaceDictionary(locale);
  const homeLabel = locale === 'ru' ? 'Главная' : 'Home';
  const productsLabel = locale === 'ru' ? 'Продукция' : 'Products';
  const targetLocale = findTargetLocale(locale);
  const pageTitle = dictionary.productDirections.categories.coatings.title;
  const pageDescription =
    locale === 'ru'
      ? 'Выберите основу покрытия, чтобы перейти к подходящим продуктам.'
      : 'Pick a coating base to jump to relevant products.';
  const cardDescriptionPrefix =
    locale === 'ru' ? 'Покрытия на основе' : 'Coatings based on';
  const ctaLabel = locale === 'ru' ? 'Смотреть товары' : 'View products';

  const cards = taxonomyOptions.bases
    .filter((option) => ALLOWED_COATING_BASES.includes(option.value))
    .sort(sortByOrderAndLabel)
    .map((option) => ({
      title: option.label,
      description: `${cardDescriptionPrefix} «${option.label}».`,
      href: buildPath(locale, ['products', 'coatings', toSlug(option.value)]),
      ctaLabel,
    }));

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={buildPath(targetLocale, ['products', 'coatings'])}
      currentPath={buildPath(locale, ['products', 'coatings'])}
    >
      <main className="page-shell">
        <section className="container space-y-6 py-10 lg:py-12">
          <Breadcrumbs
            items={[
              { label: homeLabel, href: buildPath(locale) },
              { label: productsLabel, href: buildPath(locale, ['products']) },
              { label: pageTitle },
            ]}
          />

          <SectionHeading title={pageTitle} description={pageDescription} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <ProductCategoryCard key={card.title} {...card} />
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
