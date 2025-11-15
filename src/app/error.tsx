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
      <h1 className="text-4xl font-semibold text-zinc-900">{dictionary.errors.generic.title}</h1>
      <p className="text-lg text-zinc-600">{dictionary.errors.generic.description}</p>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-zinc-900 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {dictionary.common.buttons.retry}
        </button>
        <Link
          href={buildPath(defaultLocale)}
          className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition-colors hover:border-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {dictionary.common.buttons.goHome}
        </Link>
      </div>
    </section>
  );
}