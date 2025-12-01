'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { getInterfaceDictionary } from '@/content/dictionary';
import { buildPath } from '@/lib/paths';
import { defaultLocale, isLocale } from '@/lib/i18n';
import { Button } from '@/app/(site)/shared/ui/button';
import { buttonClassNames } from '@/app/(site)/shared/ui/button-classes';

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: LocaleErrorProps) {
  const params = useParams();
  const rawLocale = typeof params?.locale === 'string' ? params.locale : Array.isArray(params?.locale) ? params?.locale[0] : undefined;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dictionary = getInterfaceDictionary(locale);
  const copy = dictionary.errors.generic;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 py-24">
      <h1 className="text-4xl font-semibold text-foreground">{copy.title}</h1>
      <p className="text-lg text-muted-foreground">{copy.description}</p>
        <div className="flex flex-wrap gap-4">
          <Button type="button" variant="secondary" onClick={() => reset()}>
            {dictionary.common.buttons.retry}
          </Button>
          <Link
            href={buildPath(locale)}
            className={buttonClassNames({
              variant: 'ghost',
              size: 'md',
              className: 'rounded-full border border-border uppercase tracking-wide hover:border-foreground',
            })}
          >
            {dictionary.common.buttons.goHome}
          </Link>
        </div>
    </section>
  );
}