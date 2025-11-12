'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { buildPath } from '@/lib/paths';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ERROR_COPY: Record<Locale, { title: string; description: string; retry: string; home: string }> = {
  ru: {
    title: 'Произошла ошибка',
    description: 'Нам не удалось загрузить страницу. Обновите страницу или вернитесь на главную.',
    retry: 'Попробовать снова',
    home: 'На главную',
  },
  en: {
    title: 'Something went wrong',
    description: 'We could not load this page. Please try again or go back to the homepage.',
    retry: 'Try again',
    home: 'Back to home',
  },
};

export default function LocaleError({ error, reset }: LocaleErrorProps) {
  const params = useParams();
  const rawLocale = typeof params?.locale === 'string' ? params.locale : Array.isArray(params?.locale) ? params?.locale[0] : undefined;
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const copy = ERROR_COPY[locale];

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
          className="rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {copy.retry}
        </button>
        <Link
          href={buildPath(locale)}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition-colors hover:border-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {copy.home}
        </Link>
      </div>
    </section>
  );
}