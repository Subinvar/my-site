import Link from 'next/link';
import { type JSX } from 'react';

import { cn } from '@/lib/cn';

type Locale = 'ru' | 'en';

export function PartnersCta({ locale, className }: { locale: Locale; className?: string }): JSX.Element {
  const title = locale === 'ru' ? 'Открыты к новым партнёрствам' : 'Open to new partnerships';

  const text =
    locale === 'ru'
      ? 'Если вы видите потенциал совместных проектов в литейной отрасли — давайте обсудим. Коротко опишите задачу, а мы предложим понятный формат взаимодействия.'
      : 'If you see potential for joint projects in the foundry industry, let’s talk. Send us a short brief, and we will propose a clear cooperation format.';

  const button = locale === 'ru' ? 'Написать на zakaz@intema.ru' : 'Email us at zakaz@intema.ru';

  return (
    <section
      className={cn(
        'mt-10 rounded-3xl border border-primary/40 bg-primary/5 px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl space-y-2">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <div className="flex-shrink-0">
        <Link
          href="mailto:zakaz@intema.ru"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {button}
        </Link>
      </div>
    </section>
  );
}
