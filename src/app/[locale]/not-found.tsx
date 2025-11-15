"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getInterfaceDictionary } from '@/content/dictionary';
import { buildPath } from '@/lib/paths';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

const resolveLocaleFromParams = (param: string | string[] | undefined): Locale => {
  const candidate = Array.isArray(param) ? param[0] : param;
  if (candidate && isLocale(candidate)) {
    return candidate;
  }
  return defaultLocale;
};

export default function LocaleNotFound() {
  const params = useParams<{ locale?: string | string[] }>();
  const locale = resolveLocaleFromParams(params?.locale);
  const dictionary = getInterfaceDictionary(locale);
  const copy = dictionary.errors.notFound;
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 py-24">
      <h1 className="text-4xl font-semibold text-zinc-900">{copy.title}</h1>
      <p className="text-lg text-zinc-600">{copy.description}</p>
      <Link
        href={buildPath(locale)}
        className="rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {dictionary.common.buttons.goHome}
      </Link>
    </section>
  );
}