"use client";

import { useEffect, useRef, useState } from 'react';

import { Card } from '@/app/(site)/shared/ui/card';
import type { Locale } from '@/lib/i18n';

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setInView(true);
      },
      { threshold },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView } as const;
}

function AnimatedNumber({ target }: { target: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target]);

  return <>{value}</>;
}

export type HomeStatsProps = {
  locale: Locale;
  items?: Array<{ label?: string; value?: string }>;
};

const STATS: Record<Locale, Array<{ label: string; value: string }>> = {
  ru: [
    { label: 'Год основания', value: '2006+' },
    { label: 'Клиентов по России', value: '50+' },
    { label: 'Наименований продукции', value: '100+' },
    { label: 'Лет в литейной отрасли', value: '15+' },
  ],
  en: [
    { label: 'Founded', value: '2006+' },
    { label: 'Clients across Russia', value: '50+' },
    { label: 'Products in portfolio', value: '100+' },
    { label: 'Years in foundry industry', value: '15+' },
  ],
};

export function HomeStats({ locale, items }: HomeStatsProps) {
  const fallback = STATS[locale];
  const withFallback = (value: string | undefined, fallbackValue: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : fallbackValue;
  };
  const list = (items?.length ? items : fallback).map((item, index) => {
    const fallbackItem = fallback[index];
    return {
      label: withFallback(item.label, fallbackItem?.label ?? ''),
      value: withFallback(item.value, fallbackItem?.value ?? ''),
    };
  });
  const visibleItems = list.filter((item) => item.label || item.value);
  const { ref, inView } = useInView(0.3);

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section
      ref={ref}
      className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
          {locale === 'ru' ? 'Интема Групп в цифрах' : 'InteMa Group in numbers'}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] sm:text-base">
          {locale === 'ru'
            ? 'Ключевые показатели нашей работы: опыт, клиенты, ассортимент и экспертиза в отрасли.'
            : 'Key indicators of our work: experience, clients, assortment, and foundry expertise.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleItems.map((item, index) => {
          const numeric = parseInt(item.value ?? '', 10);

          return (
            <Card
              key={item.label ?? `stat-${index}`}
              className="flex flex-col gap-2 bg-[var(--background)]/80 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-3xl font-semibold text-[var(--primary)] sm:text-4xl">
                {inView && !Number.isNaN(numeric) ? (
                  <>
                    <AnimatedNumber target={numeric} />
                    {item.value?.replace(String(numeric), '')}
                  </>
                ) : (
                  item.value
                )}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">{item.label}</div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
