'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { buildPath } from '@/lib/paths';
import { defaultLocale } from '@/lib/i18n';
import { getInterfaceDictionary } from '@/content/dictionary';

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
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full border border-foreground px-5 py-2 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {dictionary.common.buttons.retry}
          </button>
          <Link
            href={buildPath(defaultLocale)}
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {dictionary.common.buttons.goHome}
          </Link>
        </div>
    </section>
  );
}