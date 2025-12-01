import Image from 'next/image';

import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import type { Locale } from '@/lib/i18n';

export type PartnersStripProps = {
  locale: Locale;
};

const PARTNERS = [
  { slug: 'sq', name: 'SQ Group', logo: '/uploads/partners/sq-group.svg' },
  { slug: 'cavenaghi', name: 'Cavenaghi S.p.A.', logo: '/uploads/partners/cavenaghi.svg' },
];

export function PartnersStrip({ locale }: PartnersStripProps) {
  const isRu = locale === 'ru';

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <SectionHeading
          title={isRu ? 'Нам доверяют' : 'Trusted by'}
          description={
            isRu
              ? 'Интема Групп сотрудничает с международными производителями литейной химии и ведущими литейными заводами.'
              : 'InteMa Group cooperates with international suppliers and leading foundries.'
          }
          className="max-w-2xl"
        />

        <div className="flex flex-wrap items-center gap-6 lg:gap-10">
          {PARTNERS.map((partner) => (
            <div
              key={partner.slug}
              className="relative h-8 w-auto opacity-80 transition-opacity hover:opacity-100 md:h-10"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={140}
                height={40}
                className="h-full w-auto object-contain"
                sizes="(min-width: 1024px) 140px, (min-width: 768px) 120px, 100px"
                priority
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
