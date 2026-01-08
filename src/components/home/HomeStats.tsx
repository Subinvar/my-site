"use client";

import { AppleHoverLift } from '@/app/(site)/shared/ui/apple-hover-lift';
import { Card } from '@/app/(site)/shared/ui/card';
import type { Locale } from '@/lib/i18n';
import { useCountUp } from '@/lib/use-count-up';
import { useInView } from '@/lib/use-in-view';
import { cn } from '@/lib/cn';

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

type ParsedStat = {
  prefix: string;
  number: number | null;
  suffix: string;
};

function parseStat(value?: string): ParsedStat {
  if (!value) return { prefix: '', number: null, suffix: '' };

  const match = value.match(/-?\d+/);
  if (!match || match.index === undefined) return { prefix: '', number: null, suffix: value };

  const numberPart = Number.parseInt(match[0], 10);
  if (Number.isNaN(numberPart)) return { prefix: '', number: null, suffix: value };

  return {
    prefix: value.slice(0, match.index),
    number: numberPart,
    suffix: value.slice(match.index + match[0].length),
  };
}

function StatItem({
  label,
  value,
  inView,
  duration,
}: {
  label?: string;
  value?: string;
  inView: boolean;
  duration: number;
}) {
  const { prefix, number, suffix } = parseStat(value);
  const animated = useCountUp({ end: number ?? 0, duration, inView });
  const isNumeric = number !== null && inView;

  return (
    <AppleHoverLift strength="xs">
      <Card className="flex flex-col gap-2 bg-[var(--background)]/80">
        <div className="text-3xl font-semibold text-[var(--primary)] sm:text-4xl">
          {isNumeric ? (
            <>
              {prefix}
              {animated}
              {suffix}
            </>
          ) : (
            value
          )}
        </div>
        <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
      </Card>
    </AppleHoverLift>
  );
}

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
  const { ref, inView } = useInView({ rootMargin: '-30% 0px' });

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section
      ref={ref}
      className={cn(
        'space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8',
        'motion-fade-in-up',
      )}
      data-in-view={inView ? 'true' : 'false'}
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
        {visibleItems.map((item, index) => (
          <StatItem
            key={item.label ?? `stat-${index}`}
            label={item.label}
            value={item.value}
            inView={inView}
            duration={index === 0 ? 800 : 1200}
          />
        ))}
      </div>
    </section>
  );
}
