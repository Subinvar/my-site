import Image from 'next/image';
import Link from 'next/link';

import type { Locale } from '@/lib/i18n';
import { Button } from '@/app/(site)/shared/ui/button';

export type HeroProps = {
  locale: Locale;
};

export function Hero({ locale }: HeroProps) {
  const isRu = locale === 'ru';

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/uploads/hero-foundry.jpg"
          alt={isRu ? 'Литейное производство' : 'Foundry production'}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:py-28">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            {isRu ? 'Материалы для литейного производства' : 'Solutions for foundry industry'}
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {isRu
              ? 'Связующие, покрытия и вспомогательные материалы для литейных цехов'
              : 'Binders, coatings and auxiliaries for foundries'}
          </h1>
          <p className="max-w-xl text-base text-white/80 sm:text-lg">
            {isRu
              ? 'Помогаем литейным производствам повышать выход годной отливки, снижать пригар и стабилизировать технологию.'
              : 'We help foundries improve yield, reduce defects and stabilize their processes.'}
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href={isRu ? '/catalog' : '/en/catalog'}>
                {isRu ? 'Перейти в каталог' : 'Open catalog'}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={isRu ? '/contacts' : '/en/contacts'}>
                {isRu ? 'Связаться с нами' : 'Contact us'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
