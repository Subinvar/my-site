import Link from 'next/link';

import { Card, CardDescription, CardTitle } from '@/app/(site)/shared/ui/card';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { buildPath } from '@/lib/paths';
import type { Locale } from '@/lib/i18n';

type DirectionItem = {
  slug: string;
  title: string;
  description: string;
  category: string;
};

const DIRECTIONS = {
  ru: [
    {
      slug: 'binders',
      title: 'Связующие системы',
      description: 'Холодно- и термотвердеющие связующие для форм и стержней.',
      category: 'binders',
    },
    {
      slug: 'coatings',
      title: 'Противопригарные покрытия',
      description:
        'Водные и спиртовые покрытия с цирконовым, графитовым и др. наполнителями.',
      category: 'coatings',
    },
    {
      slug: 'aux',
      title: 'Вспомогательные материалы',
      description: 'Клеи, модификаторы, разделительные и очищающие составы.',
      category: 'aux',
    },
  ],
  en: [
    {
      slug: 'binders',
      title: 'Binder systems',
      description: 'Cold- and heat-hardening binders for molds and cores.',
      category: 'binders',
    },
    {
      slug: 'coatings',
      title: 'Anti-stick coatings',
      description:
        'Water- and alcohol-based coatings with zircon, graphite, and other fillers.',
      category: 'coatings',
    },
    {
      slug: 'aux',
      title: 'Auxiliary materials',
      description: 'Adhesives, modifiers, release and cleaning compounds.',
      category: 'aux',
    },
  ],
} satisfies Record<Locale, Array<DirectionItem>>;

type ProductDirectionsProps = {
  locale: Locale;
};

export function ProductDirections({ locale }: ProductDirectionsProps) {
  const items = DIRECTIONS[locale];

  if (!items?.length) {
    return null;
  }

  const basePath = buildPath(locale, ['catalog']);

  return (
    <section className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8">
      <SectionHeading
        title={locale === 'ru' ? 'Направления продукции' : 'Product directions'}
        description={
          locale === 'ru'
            ? 'Интема Групп закрывает весь цикл литейной химии — от связующих до вспомогательных материалов.'
            : 'InteMa Group provides a full range of materials for foundry processes.'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const href = `${basePath}?category=${encodeURIComponent(item.category)}`;
          return (
            <Card
              key={item.slug}
              as="article"
              className="group flex h-full flex-col gap-3 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
            >
              <CardTitle className="flex items-start justify-between gap-2">
                <span className="transition-colors duration-150 group-hover:text-[var(--primary)]">
                  {item.title}
                </span>
              </CardTitle>
              <CardDescription className="flex-1 text-sm leading-relaxed">
                {item.description}
              </CardDescription>
              <Link
                href={href}
                className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
              >
                {locale === 'ru' ? 'Смотреть продукты' : 'View products'}
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
