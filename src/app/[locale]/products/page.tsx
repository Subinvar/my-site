import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { getCatalogTaxonomyOptions } from '@/lib/catalog/constants';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n';
import { getProductsPage, getSite } from '@/lib/keystatic';
import { buildPath, findTargetLocale } from '@/lib/paths';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveAlternateOgLocales,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';
import {
  getProductsHubContent,
  type ProductsHubCard,
  type ProductsHubGroup,
  type ProductsHubInsight,
} from '@/lib/content/products-hub';

import { ALLOWED_AUXILIARIES, ALLOWED_BINDER_PROCESSES, ALLOWED_COATING_BASES } from './constants';
import { sortByOrderAndLabel, toSlug } from './helpers';
import { ProductsPageClient } from './products-page-client';

const normalizeSlug = (value: string): string => value.trim().replace(/^\/+|\/+$/g, '');

const splitSlug = (value: string): string[] =>
  normalizeSlug(value)
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

const resolveProductsBaseSegments = (slugByLocale: Partial<Record<Locale, string>>, locale: Locale): string[] => {
  const raw = slugByLocale[locale] ?? slugByLocale[defaultLocale] ?? 'products';
  const normalized = normalizeSlug(raw);
  return splitSlug(normalized.length ? normalized : 'products');
};

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
  'Альфа-сет':
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

const WHY_TILES_RU: ProductsHubInsight[] = [
  {
    id: 'process',
    icon: 'target',
    title: 'Подбор под процесс',
    lead: 'Отталкиваемся от технологии, а не от “любимого продукта”.',
    details: [
      'Учитываем процесс формовки/стержневой, тип смеси, режимы, требования к поверхности и прочности.',
      'Помогаем сузить выбор до рабочих вариантов и объясняем, почему они подходят.',
      'Если нужно — согласуем контрольные параметры для стабильного результата.',
    ],
    order: 0,
    hidden: false,
  },
  {
    id: 'docs',
    icon: 'file-text',
    title: 'Документы и рекомендации',
    lead: 'Техданные и безопасное применение — без лишней бюрократии.',
    details: [
      'По запросу предоставим технические данные (TDS) и паспорт безопасности (SDS), а также рекомендации по применению.',
      'Подскажем, какие параметры важны на участке (вязкость, плотность, режимы сушки/отверждения и т.д.).',
    ],
    order: 1,
    hidden: false,
  },
  {
    id: 'stability',
    icon: 'repeat-2',
    title: 'Повторяемость на производстве',
    lead: 'Цель — стабильность в партии, а не разовый “идеальный” тест.',
    details: [
      'Смотрим на внедрение как на процесс: проба → корректировки → закрепление режима.',
      'Обсуждаем типовые риски (сушка, газование, нанесение, хранение, смешивание) заранее.',
    ],
    order: 2,
    hidden: false,
  },
  {
    id: 'support',
    icon: 'hand-helping',
    title: 'Сопровождение внедрения',
    lead: 'Помогаем перейти на новый материал или процесс без хаоса.',
    details: [
      'Согласуем план внедрения: что замеряем, какие критерии “успеха”, в каком порядке меняем параметры.',
      'На старте даём “короткие правила” для участка: что критично, а что вторично.',
    ],
    order: 3,
    hidden: false,
  },
];

const WHY_TILES_EN: ProductsHubInsight[] = [
  {
    id: 'process',
    icon: 'target',
    title: 'Process-first selection',
    lead: 'We start from your technology, not from a “favorite product”.',
    details: [
      'We consider the process, sand mix, modes, surface requirements and strength targets.',
      'We help narrow down options and explain why they fit.',
      'If needed, we agree on control points for stable results.',
    ],
    order: 0,
    hidden: false,
  },
  {
    id: 'docs',
    icon: 'file-text',
    title: 'Documents & guidance',
    lead: 'Technical and safe application without extra friction.',
    details: [
      'On request, we provide TDS/SDS and practical application recommendations.',
      'We highlight key shop-floor parameters: viscosity, density, curing/drying modes, etc.',
    ],
    order: 1,
    hidden: false,
  },
  {
    id: 'stability',
    icon: 'repeat-2',
    title: 'Production repeatability',
    lead: 'Stable batches matter more than a one-off perfect trial.',
    details: [
      'We treat implementation as a process: trial → adjustments → stabilized modes.',
      'We discuss typical risks (drying, gassing, application, storage, mixing) upfront.',
    ],
    order: 2,
    hidden: false,
  },
  {
    id: 'support',
    icon: 'hand-helping',
    title: 'Implementation support',
    lead: 'A controlled transition to a new material or process.',
    details: [
      'We align the plan: what to measure, success criteria, and the order of changes.',
      'We provide shop-floor “quick rules”: what is critical and what is secondary.',
    ],
    order: 3,
    hidden: false,
  },
];

export default async function ProductsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [shell, productsPage] = await Promise.all([getSiteShellData(locale), getProductsPage(locale)]);

  if (!productsPage.published) {
    notFound();
  }

  const taxonomyOptions = getCatalogTaxonomyOptions(locale);

  const targetLocale = findTargetLocale(locale);
  const baseSegments = resolveProductsBaseSegments(productsPage.slugByLocale, locale);
  const targetBaseSegments = resolveProductsBaseSegments(productsPage.slugByLocale, targetLocale);
  const switcherHref = buildPath(targetLocale, targetBaseSegments);
  const currentPath = buildPath(locale, baseSegments);

  const pageTitle =
    productsPage.title[locale] ?? (locale === 'ru' ? 'Продукция' : 'Products');

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
      href: buildPath(locale, [...baseSegments, 'binders', toSlug(option.value)]),
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
      href: buildPath(locale, [...baseSegments, 'coatings', toSlug(option.value)]),
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
      href: buildPath(locale, [...baseSegments, 'auxiliaries', toSlug(option.value)]),
      order: index,
    }));

  const fallbackGroups: ProductsHubGroup[] = [
    {
      id: 'binders',
      slug: 'binders',
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
      slug: 'coatings',
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
      slug: 'auxiliaries',
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

  const hubContent = await getProductsHubContent(locale);
  const groups = hubContent.groups?.length ? hubContent.groups : fallbackGroups;

  const insightsFallback = locale === 'ru' ? WHY_TILES_RU : WHY_TILES_EN;
  const insights = hubContent.insights?.length ? hubContent.insights : insightsFallback;
  const sortedInsights = [...insights].sort((a, b) => a.order - b.order);

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
      <main id="main" className="page-shell">
        {/* Визуально H1 скрываем (просили убрать заголовок со страницы),
            но оставляем для семантики/доступности. */}
        <h1 className="sr-only">{pageTitle}</h1>

        <ProductsPageClient locale={locale} groups={groups} insights={sortedInsights} />
      </main>
    </SiteShellLayout>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }

  const locale = rawLocale;
  const [site, productsPage] = await Promise.all([getSite(locale), getProductsPage(locale)]);

  if (!productsPage.published) {
    return {};
  }

  const pageSeo = productsPage.seo;

  const slugMap: Partial<Record<Locale, string>> = {};
  for (const candidateLocale of locales) {
    const baseSegments = resolveProductsBaseSegments(productsPage.slugByLocale, candidateLocale);
    slugMap[candidateLocale] = buildPath(candidateLocale, baseSegments);
  }

  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });

  const fallbackTitle = productsPage.title[locale] ?? (locale === 'ru' ? 'Продукция' : 'Products');
  const fallbackDescription =
    productsPage.description[locale] ??
    (locale === 'ru'
      ? 'Продукты и решения Интема Групп для литейного производства.'
      : 'Intema Group products and solutions for foundry production.');

  const merged = mergeSeo({
    site: site.seo,
    page: pageSeo,
    defaults: { title: fallbackTitle, description: fallbackDescription },
  });

  const canonicalUrl = merged.canonicalOverride ?? alternates.canonical;
  const alternatesData: Metadata['alternates'] = {
    languages: alternates.languages,
  };
  if (canonicalUrl) {
    alternatesData.canonical = canonicalUrl;
  }

  const currentHrefLang = HREFLANG_CODE[locale];
  const preferredUrl = canonicalUrl ?? alternates.languages[currentHrefLang];
  const ogImage = resolveOpenGraphImage(merged.ogImage, site.seo.canonicalBase);
  const alternateOgLocales = resolveAlternateOgLocales(locale, slugMap);
  const descriptionFallback = merged.description ?? undefined;
  const ogDescriptionFallback = merged.ogDescription ?? descriptionFallback;
  const ogTitleFallback = merged.ogTitle ?? merged.title ?? fallbackTitle;

  return {
    title: merged.title ?? fallbackTitle,
    description: descriptionFallback,
    alternates: alternatesData,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      alternateLocale: alternateOgLocales.length ? alternateOgLocales : undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  } satisfies Metadata;
}
