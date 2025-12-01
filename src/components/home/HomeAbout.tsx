import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/app/(site)/shared/ui/button';
import type { Locale } from '@/lib/i18n';

export type HomeAboutProps = {
  locale: Locale;
};

export function HomeAbout({ locale }: HomeAboutProps) {
  const isRu = locale === 'ru';

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
        <div className="space-y-5">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            {isRu ? 'О компании Интема Групп' : 'About InteMa Group'}
          </h2>
          <p className="text-[var(--muted-foreground)]">
            {isRu
              ? 'С 2006 года мы разрабатываем и поставляем материалы для литейных производств: связующие системы, противопригарные покрытия и вспомогательные материалы.'
              : 'Since 2006 we have been supplying foundries with binders, coatings and auxiliary materials.'}
          </p>
          <p className="text-[var(--muted-foreground)]">
            {isRu
              ? 'Работаем с литейными цехами по всей России, помогаем запускать новые линии и улучшать существующие процессы.'
              : 'We support foundries across Russia, helping launch new lines and optimize existing ones.'}
          </p>

          <Button asChild variant="secondary">
            <Link href={isRu ? '/o-kompanii' : '/en/about'}>
              {isRu ? 'Подробнее о компании' : 'Learn more'}
            </Link>
          </Button>
        </div>

        <div className="relative h-56 sm:h-72 lg:h-80">
          <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/uploads/about-plant.jpg"
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
