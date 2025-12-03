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

import { ALLOWED_BINDER_PROCESSES } from '../constants';
import { sortByOrderAndLabel, toSlug } from '../helpers';

type PageParams = { locale: Locale };

type PageProps = { params: Promise<PageParams> };

export default async function BinderProcessPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

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
  const pageTitle = dictionary.productDirections.categories.binders.title;
  const pageDescription =
    locale === 'ru'
      ? 'Выберите технологический процесс, чтобы увидеть связующие под него.'
      : 'Choose the core-making process to see matching binders.';
  const cardDescriptionPrefix =
    locale === 'ru' ? 'Связующие для процесса' : 'Binders for';
  const ctaLabel = locale === 'ru' ? 'Смотреть товары' : 'View products';

  const cards = taxonomyOptions.processes
    .filter((option) => ALLOWED_BINDER_PROCESSES.includes(option.value))
    .sort(sortByOrderAndLabel)
    .map((option) => ({
      title: option.label,
      description: `${cardDescriptionPrefix} «${option.label}».`,
      href: buildPath(locale, ['products', 'binders', toSlug(option.value)]),
      ctaLabel,
    }));

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={buildPath(targetLocale, ['products', 'binders'])}
      currentPath={buildPath(locale, ['products', 'binders'])}
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
