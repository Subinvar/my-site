"use client";

import Image from 'next/image';
import Link from 'next/link';

import type { Locale } from '@/lib/i18n';
import { Button } from '@/app/(site)/shared/ui/button';
import { useInView } from '@/lib/use-in-view';
import { cn } from '@/lib/cn';

export type HeroProps = {
  locale: Locale;
  data?: {
    title?: string;
    subtitle?: string;
    preheading?: string;
    primaryCtaLabel?: string;
    primaryCtaHref?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
  };
};

export function Hero({ locale, data }: HeroProps) {
  const isRu = locale === 'ru';
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '0px' });

  const withFallback = (value: string | undefined, fallback: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : fallback;
  };

  const title = withFallback(
    data?.title,
    isRu
      ? 'Связующие, покрытия и вспомогательные материалы для литейных цехов'
      : 'Binders, coatings and auxiliaries for foundries'
  );

  const subtitle = withFallback(
    data?.subtitle,
    isRu
      ? 'Помогаем литейным производствам повышать выход годной отливки, снижать пригар и стабилизировать технологию.'
      : 'We help foundries improve yield, reduce defects and stabilize their processes.'
  );

  const preheading = withFallback(
    data?.preheading,
    isRu ? 'Материалы для литейного производства' : 'Solutions for foundry industry'
  );

  const primaryCtaLabel = withFallback(data?.primaryCtaLabel, isRu ? 'Перейти в каталог' : 'Open catalog');
  const primaryCtaHref = withFallback(data?.primaryCtaHref, isRu ? '/catalog' : '/en/catalog');

  const secondaryCtaLabel = withFallback(data?.secondaryCtaLabel, isRu ? 'Связаться с нами' : 'Contact us');
  const secondaryCtaHref = withFallback(data?.secondaryCtaHref, isRu ? '/contacts' : '/en/contacts');

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <Image
          src="/uploads/hero.jpg"
          alt={isRu ? 'Литейное производство' : 'Foundry production'}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
      </div>
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:py-28">
        <div
          ref={ref}
          className={cn('max-w-2xl space-y-6 motion-fade-in-up')}
          data-in-view={inView ? 'true' : 'false'}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            {preheading}
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="max-w-xl text-base text-white/80 sm:text-lg">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
