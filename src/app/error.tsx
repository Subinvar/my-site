'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { buildPath } from '@/lib/paths';
import { defaultLocale } from '@/lib/i18n';
import { getInterfaceDictionary } from '@/content/dictionary';
import { Button } from '@/app/(site)/shared/ui/button';
import { buttonClassNames } from '@/app/(site)/shared/ui/button-classes';

const dictionary = getInterfaceDictionary(defaultLocale);

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-24">
      <h1 className="text-4xl font-semibold text-foreground">{dictionary.errors.generic.title}</h1>
      <p className="text-lg text-muted-foreground">{dictionary.errors.generic.description}</p>
        <div className="flex flex-wrap gap-4">
          <Button type="button" variant="secondary" onClick={() => reset()}>
            {dictionary.common.buttons.retry}
          </Button>
          <Link
            href={buildPath(defaultLocale)}
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