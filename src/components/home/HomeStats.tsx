import { Card } from '@/app/(site)/shared/ui/card';
import type { Locale } from '@/lib/i18n';

export type HomeStatsProps = {
  locale: Locale;
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

export function HomeStats({ locale }: HomeStatsProps) {
  const items = STATS[locale];

  if (!items?.length) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8">
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
        {items.map((item) => (
          <Card
            key={item.label}
            className="flex flex-col gap-2 bg-[var(--background)]/80 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-3xl font-semibold text-[var(--primary)] sm:text-4xl">
              {item.value}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">{item.label}</div>
          </Card>
        ))}
      </div>
    </section>
  );
}
