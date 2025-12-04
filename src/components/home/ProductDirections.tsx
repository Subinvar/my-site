"use client";

import Link from 'next/link';
import type { ReactElement } from 'react';

import { Card, CardDescription } from '@/app/(site)/shared/ui/card';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { buildPath } from '@/lib/paths';
import type { Locale } from '@/lib/i18n';
import { useInView } from '@/lib/use-in-view';
import { cn } from '@/lib/cn';

const directionIcons: Record<string, ReactElement> = {
  binders: <span className="inline-block text-2xl">🧪</span>,
  coatings: <span className="inline-block text-2xl">🎨</span>,
  aux: <span className="inline-block text-2xl">🧰</span>,
};

type DirectionItem = {
  key?: string;
  title?: string;
  description?: string;
  href?: string;
};

type FallbackDirection = DirectionItem & { category: string; key: string };

const DIRECTIONS: Record<Locale, Array<FallbackDirection>> = {
  ru: [
    {
      key: 'binders',
      title: 'Связующие системы',
      description: 'Холодно- и термотвердеющие связующие для форм и стержней.',
      category: 'binders',
    },
    {
      key: 'coatings',
      title: 'Противопригарные покрытия',
      description:
        'Водные и спиртовые покрытия с цирконовым, графитовым и др. наполнителями.',
      category: 'coatings',
    },
    {
      key: 'aux',
      title: 'Вспомогательные материалы',
      description: 'Клеи, модификаторы, разделительные и очищающие составы.',
      category: 'aux',
    },
  ],
  en: [
    {
      key: 'binders',
      title: 'Binder systems',
      description: 'Cold- and heat-hardening binders for molds and cores.',
      category: 'binders',
    },
    {
      key: 'coatings',
      title: 'Anti-stick coatings',
      description:
        'Water- and alcohol-based coatings with zircon, graphite, and other fillers.',
      category: 'coatings',
    },
    {
      key: 'aux',
      title: 'Auxiliary materials',
      description: 'Adhesives, modifiers, release and cleaning compounds.',
      category: 'aux',
    },
  ],
};

type ProductDirectionsProps = {
  locale: Locale;
  items?: DirectionItem[];
};

export function ProductDirections({ locale, items }: ProductDirectionsProps) {
  const basePath = buildPath(locale, ['catalog']);
  const { ref, inView } = useInView({ rootMargin: '-20% 0px' });
  const withFallback = (value: string | undefined, fallback: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : fallback;
  };
  const fallbackItems = DIRECTIONS[locale].map((item) => ({
    key: item.key,
    title: item.title,
    description: item.description,
    href: `${basePath}?category=${encodeURIComponent(item.category)}`,
  }));
  const fallbackByKey = new Map(fallbackItems.map((item) => [item.key, item]));

  const list = (items?.length ? items : fallbackItems).map((item, index) => {
    const normalizedKey = item.key?.trim();
    const fallback = normalizedKey
      ? fallbackByKey.get(normalizedKey) ?? fallbackItems[index]
      : fallbackItems[index];
    return {
      key: normalizedKey || fallback?.key || `direction-${index}`,
      title: withFallback(item.title, fallback?.title ?? ''),
      description: withFallback(item.description, fallback?.description ?? ''),
      href: withFallback(item.href, fallback?.href ?? basePath),
    } satisfies Required<DirectionItem>;
  });

  const visibleItems = list.filter((item) => item.title || item.description || item.href);

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section
      ref={ref}
      className={cn('rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8', 'motion-fade-in-up')}
      data-in-view={inView ? 'true' : 'false'}
    >
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
        {visibleItems.map((item) => {
          const href = item.href ?? basePath;
          return (
            <Card
              key={item.key}
              as="article"
              className="group flex h-full flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-full flex-col gap-3">
                <div className="text-3xl">
                  {directionIcons[item.key] ?? <span className="inline-block text-2xl">⚙️</span>}
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
