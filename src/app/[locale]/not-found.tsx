"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { getInterfaceDictionary } from '@/content/dictionary';
import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';

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
      <h1 className="text-4xl font-semibold text-foreground">{copy.title}</h1>
      <p className="text-lg text-muted-foreground">{copy.description}</p>
      <Link
        href={buildPath(locale)}
        className={cn(
          'rounded-full border border-foreground px-4 py-2 text-sm font-semibold uppercase tracking-wide text-foreground transition',
          'hover:bg-foreground hover:text-background',
          focusRingBase,
        )}
      >
        {dictionary.common.buttons.goHome}
      </Link>
    </section>
  );
}