import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/app/(site)/shared/ui/button';
import type { Locale } from '@/lib/i18n';

export type HomeAboutProps = {
  locale: Locale;
  data?: {
    title?: string;
    paragraph1?: string;
    paragraph2?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
};

export function HomeAbout({ locale, data }: HomeAboutProps) {
  const isRu = locale === 'ru';

  const withFallback = (value: string | undefined, fallback: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : fallback;
  };

  const title = withFallback(data?.title, isRu ? 'О компании Интема Групп' : 'About InteMa Group');
  const paragraph1 = withFallback(
    data?.paragraph1,
    isRu
      ? 'С 2006 года мы разрабатываем и поставляем материалы для литейных производств: связующие системы, противопригарные покрытия и вспомогательные материалы.'
      : 'Since 2006 we have been supplying foundries with binders, coatings and auxiliary materials.'
  );
  const paragraph2 = withFallback(
    data?.paragraph2,
    isRu
      ? 'Работаем с литейными цехами по всей России, помогаем запускать новые линии и улучшать существующие процессы.'
      : 'We support foundries across Russia, helping launch new lines and optimize existing ones.'
  );
  const ctaLabel = withFallback(data?.ctaLabel, isRu ? 'Подробнее о компании' : 'Learn more');
  const ctaHref = withFallback(data?.ctaHref, isRu ? '/o-kompanii' : '/en/about');

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
        <div className="space-y-5">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            {title}
          </h2>
          <p className="text-[var(--muted-foreground)]">
            {paragraph1}
          </p>
          <p className="text-[var(--muted-foreground)]">
            {paragraph2}
          </p>

          <Button asChild variant="secondary">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>

        <div className="relative h-56 sm:h-72 lg:h-80">
          <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/uploads/hero.jpg"
              alt={isRu ? 'Производство Интема Групп' : 'InteMa production site'}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 360px, 100vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
