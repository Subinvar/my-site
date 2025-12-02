import Link from 'next/link';

import { Card, CardDescription } from '@/app/(site)/shared/ui/card';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { buildPath } from '@/lib/paths';
import type { Locale } from '@/lib/i18n';

const directionIcons: Record<string, JSX.Element> = {
  binders: <span className="inline-block text-2xl">🧪</span>,
  coatings: <span className="inline-block text-2xl">🎨</span>,
  aux: <span className="inline-block text-2xl">🧰</span>,
};

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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8">
      <SectionHeading
        title={locale === 'ru' ? 'Направления продукции' : 'Product directions'}
        description={
          locale === 'ru'
            ? 'Интема Групп закрывает весь цикл литейной химии — от связующих до вспомогательных материалов.'
            : 'InteMa Group provides a full range of materials for foundry processes.'
        }
        className="mb-6 sm:mb-8"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const href = `${basePath}?category=${encodeURIComponent(item.category)}`;
          return (
            <Card
              key={item.slug}
              as="article"
              className="group flex h-full flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-full flex-col gap-3">
                <div className="text-3xl">
                  {directionIcons[item.slug] ?? <span className="inline-block text-2xl">⚙️</span>}
                </div>
                <h3 className="text-lg font-semibold transition-colors group-hover:text-[var(--primary)]">
                  {item.title}
                </h3>
                <CardDescription className="flex-1 text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
                <Link
                  href={href}
                  className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                >
                  {locale === 'ru' ? 'Смотреть продукты' : 'View products'}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
