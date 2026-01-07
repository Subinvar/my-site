import { notFound } from 'next/navigation';

import { ProductCategoryCard } from '@/app/(site)/shared/ui/product-category-card';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
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
  const shell = await getSiteShellData(locale);
  const taxonomyOptions = getCatalogTaxonomyOptions(locale);
  const dictionary = getInterfaceDictionary(locale);
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
    <SiteShellLayout
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={buildPath(targetLocale, ['products', 'binders'])}
      currentPath={buildPath(locale, ['products', 'binders'])}
      currentYear={shell.currentYear}
    >
      <main id="main" className="page-shell">
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