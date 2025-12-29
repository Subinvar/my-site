import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { resolveContentPageMetadata } from '@/app/(site)/shared/content-page';
import { getCatalogTaxonomyOptions } from '@/lib/catalog/constants';
import { isLocale, type Locale } from '@/lib/i18n';
import { buildPath, findTargetLocale } from '@/lib/paths';
import { getProductsHubContent, type ProductsHubCard, type ProductsHubGroup } from '@/lib/content/products-hub';

import { ALLOWED_AUXILIARIES, ALLOWED_BINDER_PROCESSES, ALLOWED_COATING_BASES } from './constants';
import { sortByOrderAndLabel, toSlug } from './helpers';
import { ProductsPageClient } from './products-page-client';

type PageParams = { locale: Locale };

type PageProps = {
  params: Promise<PageParams>;
};

const CARD_PLACEHOLDER = {
  src: '/placeholders/product-card.svg',
  alt: '',
} as const;

const BINDER_CARD_DESCRIPTIONS_RU: Record<string, string> = {
  // Короткие, «технологичные» описания — чтобы карточки читались быстро.
  // Ключ = raw taxonomy value (важно: используется в URL).
  'Альфа-cет':
    'Щелочные фенолформальдегидные связующие, отверждаемые сложными эфирами (различная живучесть).',
  ЖСС: 'Жидкостекольные системы: жидкое стекло, добавки и отвердители под режимы участка.',
  'Колд-Бокс':
    'Полиуретановые cold-box системы: смола/изоцианат и отверждение газообразным амином.',
  Кронинг:
    'Термореактивные смолы и добавки для оболочковых форм и стержней (процесс Кронинга).',
  'Пеп-сет':
    'Кислотно-отверждаемые системы (PEP-SET): связующие и катализаторы для форм и стержней.',
  'Резол-CO₂':
    'Резольные (щелочные фенольные) связующие, отверждаемые CO₂; материалы под стабильную прочность.',
  Фуран: 'Фурановые смолы и кислотные отвердители для форм и стержней; настройка под требования литья.',
};

const COATING_CARD_DESCRIPTIONS_RU: Record<string, string> = {
  Спиртовое: 'Быстросохнущие покрытия для форм и стержней; выбираются по наполнителю и условиям нанесения.',
  Водное: 'Покрытия на водной основе; подбор по наполнителю, вязкости и условиям сушки.',
};

const AUXILIARY_CARD_DESCRIPTIONS_RU: Record<string, string> = {
  'Разделительный состав':
    'Разделительные составы для оснастки и поверхностей: стабильный съём и защита в процессе работы.',
  Клей: 'Клеи для сборки стержней и ремонта форм; подбор по вязкости и скорости схватывания.',
  'Ремонтная паста': 'Пасты для локального ремонта форм/стержней: заделка сколов, раковин и дефектов.',
  'Уплотнительный шнур': 'Шнуры для герметизации разъёмов и стыков; стойкость к температуре и газам.',
  'Отмывающий состав': 'Составы для очистки инструмента и оборудования от смол и покрытий; выбор по загрязнению.',
  'Экзотермическая смесь':
    'Экзотермические смеси для питания отливок и узлов; формы поставки под конкретную задачу.',
  Модификатор: 'Модификаторы для корректировки свойств смеси и качества поверхности; подбор под рецептуру.',
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

  const pageTitle = locale === 'ru' ? 'Продукция' : 'Products';

  const binders: ProductsHubCard[] = taxonomyOptions.processes
    .filter((option) => ALLOWED_BINDER_PROCESSES.includes(option.value))
    .sort(sortByOrderAndLabel)
    .map((option, index) => ({
      id: `binders-${option.value}`,
      title: option.label,
      description:
        locale === 'ru'
          ? (BINDER_CARD_DESCRIPTIONS_RU[option.value] ?? `Связующие для процесса «${option.label}».`)
          : `Binders for “${option.label}”.`,
      image: CARD_PLACEHOLDER,
      href: buildPath(locale, ['products', 'binders', toSlug(option.value)]),
      order: index,
    }));

  const coatings: ProductsHubCard[] = taxonomyOptions.bases
    .filter((option) => ALLOWED_COATING_BASES.includes(option.value))
    .sort(sortByOrderAndLabel)
    .map((option, index) => ({
      id: `coatings-${option.value}`,
      title: option.label,
      description:
        locale === 'ru'
          ? (COATING_CARD_DESCRIPTIONS_RU[option.value] ?? `Покрытия на ${option.label.toLowerCase()} основе.`)
          : `${option.label} coatings.`,
      image: CARD_PLACEHOLDER,
      href: buildPath(locale, ['products', 'coatings', toSlug(option.value)]),
      order: index,
    }));

  const auxiliaries: ProductsHubCard[] = taxonomyOptions.auxiliaries
    .filter((option) => ALLOWED_AUXILIARIES.includes(option.value))
    .sort(sortByOrderAndLabel)
    .map((option, index) => ({
      id: `auxiliaries-${option.value}`,
      title: option.label,
      description:
        locale === 'ru'
          ? (AUXILIARY_CARD_DESCRIPTIONS_RU[option.value] ?? `Вспомогательные материалы: ${option.label.toLowerCase()}.`)
          : `Auxiliary materials: ${option.label.toLowerCase()}.`,
      image: CARD_PLACEHOLDER,
      href: buildPath(locale, ['products', 'auxiliaries', toSlug(option.value)]),
      order: index,
    }));

  const fallbackGroups: ProductsHubGroup[] = [
    {
      id: 'binders',
      title: locale === 'ru' ? 'Связующие системы' : 'Binder systems',
      description:
        locale === 'ru'
          ? 'Связующие и отвердители для основных процессов формовки и стержневого производства.'
          : 'Binders and hardeners for the main moulding and core-making processes.',
      icon: 'beaker',
      order: 0,
      cards: binders,
    },
    {
      id: 'coatings',
      title: locale === 'ru' ? 'Противопригарные покрытия' : 'Coatings',
      description:
        locale === 'ru'
          ? 'Спиртовые покрытия и покрытия на водной основе с широкой линейкой наполнителей.'
          : 'Alcohol- and water-based coatings with a wide range of fillers.',
      icon: 'roller',
      order: 1,
      cards: coatings,
    },
    {
      id: 'auxiliaries',
      title: locale === 'ru' ? 'Вспомогательные материалы' : 'Auxiliary materials',
      description:
        locale === 'ru'
          ? 'Сервисные материалы для участка: разделительные составы, клеи, ремонтные пасты, шнуры, отмывающие составы, экзотермика, модификаторы.'
          : 'Service supplies: release compounds, glues, repair pastes, sealing cords, cleaners, exothermics, modifiers.',
      icon: 'sparkles',
      order: 2,
      cards: auxiliaries,
    },
  ];

  const hubGroups = await getProductsHubContent(locale);
  const groups = hubGroups?.length ? hubGroups : fallbackGroups;

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
        <section className="mx-auto w-full max-w-screen-2xl px-[var(--header-pad-x)] py-10 lg:py-12">
          <header className="mb-6 space-y-4 lg:mb-8">
            {/* Визуально H1 скрываем (просили убрать заголовок со страницы),
                но оставляем для семантики/доступности. */}
            <h1 className="sr-only">{pageTitle}</h1>
          </header>

          <ProductsPageClient locale={locale} groups={groups} />
        </section>
      </main>
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
