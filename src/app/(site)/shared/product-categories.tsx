import type { JSX } from 'react';
import { Beaker, PaintRoller, Sparkles } from 'lucide-react';

import { ProductCategoryCard } from './ui/product-category-card';
import { SectionHeading } from './ui/section-heading';
import { buildPath } from '@/lib/paths';
import { getCatalogTaxonomyOptions, type CatalogCategory } from '@/lib/catalog/constants';
import type { Locale } from '@/lib/i18n';

const CATEGORY_DESCRIPTIONS: Record<CatalogCategory, { ru: string; en: string }> = {
  Связующие: {
    ru: 'Связующие системы под ваши процессы: холодный/горячий ящик, самотвердеющие смеси и специальные решения.',
    en: 'Binder systems tuned to your processes: cold/hot box, self-setting mixes, and special solutions.',
  },
  'Противопригарные покрытия': {
    ru: 'Спиртовые и водные покрытия для стабильной поверхности отливок и снижения пригаров.',
    en: 'Alcohol- and water-based coatings for predictable cast surfaces and reduced burn-on.',
  },
  'Вспомогательные материалы': {
    ru: 'Клеи, модификаторы, разделительные и очищающие составы, экзотермические смеси и другие сервисные материалы.',
    en: 'Adhesives, modifiers, release and cleaning compounds, exothermic mixes and other service supplies.',
  },
};

const SECTION_COPY = {
  heading: {
    ru: 'Направления продукции',
    en: 'Product directions',
  },
  description: {
    ru: 'Выберите направление, чтобы сразу перейти к подходящим материалам в каталоге.',
    en: 'Pick a direction to jump straight to the matching materials in the catalogue.',
  },
};

const CTA_LABEL = {
  ru: 'Смотреть каталог',
  en: 'View catalogue',
};

const CATEGORY_ICONS: Record<CatalogCategory, JSX.Element> = {
  Связующие: <Beaker className="h-6 w-6" aria-hidden />,
  'Противопригарные покрытия': <PaintRoller className="h-6 w-6" aria-hidden />,
  'Вспомогательные материалы': <Sparkles className="h-6 w-6" aria-hidden />,
};

export function ProductCategoriesSection({ locale }: { locale: Locale }) {
  const categories = getCatalogTaxonomyOptions(locale).categories.map((entry) => ({
    title: entry.label,
    description: CATEGORY_DESCRIPTIONS[entry.value]?.[locale] ?? entry.label,
    href: buildCategoryHref(locale, entry.value),
    icon: CATEGORY_ICONS[entry.value],
    ctaLabel: CTA_LABEL[locale],
  }));

  if (!categories.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <SectionHeading title={SECTION_COPY.heading[locale]} description={SECTION_COPY.description[locale]} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <ProductCategoryCard key={category.title} {...category} />
        ))}
      </div>
    </section>
  );
}

function buildCategoryHref(locale: Locale, category: CatalogCategory): string {
  const basePath = buildPath(locale, ['catalog']);
  const search = new URLSearchParams({ category }).toString();
  return `${basePath}?${search}`;
}
