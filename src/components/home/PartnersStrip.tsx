"use client";

import Image from 'next/image';

import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import type { Locale } from '@/lib/i18n';
import { useInView } from '@/lib/use-in-view';
import { cn } from '@/lib/cn';

export type PartnersStripProps = {
  locale: Locale;
  intro?: {
    title?: string;
    description?: string;
  };
};

const PARTNERS = [
  { slug: 'sq', name: 'SQ Group', logo: '/uploads/partners/sq-group.svg' },
  { slug: 'cavenaghi', name: 'Cavenaghi S.p.A.', logo: '/uploads/partners/cavenaghi.svg' },
];

export function PartnersStrip({ locale, intro }: PartnersStripProps) {
  const isRu = locale === 'ru';
  const { ref, inView } = useInView({ rootMargin: '-20% 0px' });

  const withFallback = (value: string | undefined, fallback: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : fallback;
  };

  const title = withFallback(intro?.title, isRu ? 'Нам доверяют' : 'Trusted by');
  const description = withFallback(
    intro?.description,
    isRu
      ? 'Интема Групп сотрудничает с международными производителями литейной химии и ведущими литейными заводами.'
      : 'InteMa Group cooperates with international suppliers and leading foundries.'
  );

  return (
    <section
      ref={ref}
      className={cn('rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8', 'motion-fade-in-up')}
      data-in-view={inView ? 'true' : 'false'}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <SectionHeading
          title={title}
          description={description}
          className="max-w-2xl"
        />

        <div className="flex flex-wrap items-center gap-6 lg:gap-10">
          {PARTNERS.map((partner) => (
            <div
              key={partner.slug}
              className="relative h-8 w-auto opacity-60 transition-opacity grayscale hover:opacity-100 hover:grayscale-0 md:h-10"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={120}
                height={40}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
