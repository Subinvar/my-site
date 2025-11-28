'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { getInterfaceDictionary } from '@/content/dictionary';
import { buildPath } from '@/lib/paths';
import { defaultLocale, isLocale } from '@/lib/i18n';

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
      <h1 className="text-4xl font-semibold text-zinc-900">{copy.title}</h1>
      <p className="text-lg text-zinc-600">{copy.description}</p>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {dictionary.common.buttons.retry}
        </button>
        <Link
          href={buildPath(locale)}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition-colors hover:border-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {dictionary.common.buttons.goHome}
        </Link>
      </div>
    </section>
  );
}