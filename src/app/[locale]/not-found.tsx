'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDictionary } from '@/lib/use-dictionary';
import { DEFAULT_LOCALE, isLocale, localizePath, type Locale } from '@/lib/i18n';

export default function LocaleNotFound() {
  const params = useParams();
  const localeParam = typeof params?.locale === 'string' ? params.locale : Array.isArray(params?.locale) ? params?.locale[0] : undefined;
  const locale = (isLocale(localeParam) ? localeParam : DEFAULT_LOCALE) as Locale;
  const dictionary = useDictionary();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
      <div className="space-y-3" role="status" aria-live="polite">
        <h1 className="text-3xl font-bold text-zinc-900">{dictionary.messages.errors.notFoundTitle}</h1>
        <p className="text-base text-zinc-600">{dictionary.messages.errors.notFoundDescription}</p>
      </div>
      <Link
        href={localizePath(locale, '')}
        aria-label={dictionary.header.homeAriaLabel}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
      >
        {dictionary.common.buttons.goHome}
      </Link>
    </div>
  );
}