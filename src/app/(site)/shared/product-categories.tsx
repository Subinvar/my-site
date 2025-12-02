import type { JSX } from 'react';
import { Beaker, PaintRoller, Sparkles } from 'lucide-react';

import { ProductCategoryCard } from './ui/product-category-card';
import { SectionHeading } from './ui/section-heading';
import { getInterfaceDictionary } from '@/content/dictionary';
import { getCatalogTaxonomyOptions, type CatalogCategory } from '@/lib/catalog/constants';
import type { Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';

type ProductDirectionKey = 'binders' | 'coatings' | 'auxiliaries';

const CATEGORY_KEYS: Record<CatalogCategory, ProductDirectionKey> = {
  Связующие: 'binders',
  'Противопригарные покрытия': 'coatings',
  'Вспомогательные материалы': 'auxiliaries',
};

const CATEGORY_ICONS: Record<CatalogCategory, JSX.Element> = {
  Связующие: <Beaker className="h-6 w-6" aria-hidden />,
  'Противопригарные покрытия': <PaintRoller className="h-6 w-6" aria-hidden />,
  'Вспомогательные материалы': <Sparkles className="h-6 w-6" aria-hidden />,
};

export function ProductCategoriesSection({ locale }: { locale: Locale }) {
  const productDirections = getInterfaceDictionary(locale).productDirections;

  const categories = getCatalogTaxonomyOptions(locale).categories
    .map((entry) => {
      const key = CATEGORY_KEYS[entry.value];
      const dictionaryCategory = productDirections.categories[key];

      return {
        title: dictionaryCategory.title,
        description: dictionaryCategory.description,
        href: buildCategoryHref(locale, entry.value),
        icon: CATEGORY_ICONS[entry.value],
        ctaLabel: productDirections.ctaLabel,
      };
    })
    .filter(Boolean);

  if (!categories.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <SectionHeading
        title={productDirections.sectionHeading}
        description={productDirections.sectionDescription}
      />

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
