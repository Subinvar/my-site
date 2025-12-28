import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/app/(site)/shared/ui/breadcrumbs';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { resolveContentPageMetadata } from '@/app/(site)/shared/content-page';
import { getCatalogTaxonomyOptions } from '@/lib/catalog/constants';
import { isLocale, type Locale } from '@/lib/i18n';
import { buildPath, findTargetLocale } from '@/lib/paths';

import { ALLOWED_AUXILIARIES, ALLOWED_BINDER_PROCESSES, ALLOWED_COATING_BASES } from './constants';
import { sortByOrderAndLabel, toSlug } from './helpers';
import { ProductsPageClient, type ProductsHubCard } from './products-page-client';

type PageParams = { locale: Locale };

type PageProps = {
  params: Promise<PageParams>;
};

export default async function ProductsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;

  const [shell, taxonomyOptions] = await Promise.all([
    getSiteShellData(locale),
    Promise.resolve(getCatalogTaxonomyOptions(locale)),
  ]);

  const targetLocale = findTargetLocale(locale);
  const switcherHref = buildPath(targetLocale, ['products']);
  const currentPath = buildPath(locale, ['products']);

  const homeLabel = locale === 'ru' ? 'Главная' : 'Home';
  const pageTitle = locale === 'ru' ? 'Продукция' : 'Products';

  const introDescription =
    locale === 'ru'
      ? 'Связующие системы, противопригарные покрытия и вспомогательные материалы для литейного производства. Выберите раздел или технологию — и сразу откройте подходящие позиции.'
      : 'Binders, foundry coatings and auxiliary materials. Pick a direction or a process to jump straight to the matching items.';

  const binders: ProductsHubCard[] = taxonomyOptions.processes
    .filter((option) => ALLOWED_BINDER_PROCESSES.includes(option.value))
    .sort(sortByOrderAndLabel)
    .map((option) => ({
      kind: 'binders',
      value: option.value,
      title: option.label,
      description:
        locale === 'ru'
          ? `Связующие для процесса «${option.label}».`
          : `Binders for “${option.label}”.`,
      href: buildPath(locale, ['products', 'binders', toSlug(option.value)]),
    }));

  const coatings: ProductsHubCard[] = taxonomyOptions.bases
    .filter((option) => ALLOWED_COATING_BASES.includes(option.value))
    .sort(sortByOrderAndLabel)
    .map((option) => ({
      kind: 'coatings',
      value: option.value,
      title: option.label,
      description:
        locale === 'ru'
          ? option.value === 'Водное'
            ? 'Покрытия на водной основе.'
            : option.value === 'Спиртовое'
              ? 'Покрытия на спиртовой основе.'
              : `Покрытия на ${option.label.toLowerCase()} основе.`
          : `${option.label} coatings.`,
      href: buildPath(locale, ['products', 'coatings', toSlug(option.value)]),
    }));

  const auxiliaries: ProductsHubCard[] = taxonomyOptions.auxiliaries
    .filter((option) => ALLOWED_AUXILIARIES.includes(option.value))
    .sort(sortByOrderAndLabel)
    .map((option) => ({
      kind: 'auxiliaries',
      value: option.value,
      title: option.label,
      description:
        locale === 'ru'
          ? `Вспомогательные материалы: ${option.label.toLowerCase()}.`
          : `Auxiliary materials: ${option.label.toLowerCase()}.`,
      href: buildPath(locale, ['products', 'auxiliaries', toSlug(option.value)]),
    }));

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
      <div className="space-y-10">
        <div className="space-y-4">
          <Breadcrumbs
            items={[{ label: homeLabel, href: buildPath(locale) }, { label: pageTitle }]}
          />
          <SectionHeading title={pageTitle} description={introDescription} as="h1" />
        </div>

        <ProductsPageClient
          locale={locale}
          title={pageTitle}
          binders={binders}
          coatings={coatings}
          auxiliaries={auxiliaries}
        />
      </div>
    </SiteShellLayout>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }

  // SEO берём из Keystatic-страницы "products" (контент можно менять без правок кода).
  return resolveContentPageMetadata(rawLocale, 'products');
}
