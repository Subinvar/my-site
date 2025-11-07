import Link from 'next/link';
import { SUPPORTED_LOCALES, type Locale, localizePath, DEFAULT_LOCALE, LOCALE_LABELS } from '@/lib/i18n';
import type { UiDictionary } from '@/lib/keystatic';

type LanguageSwitcherProps = {
  locale: Locale;
  localizedSlugs: Partial<Record<Locale, string>>;
  currentSlug?: string;
  dictionary: UiDictionary['common']['languageSwitcher'];
};

export function LanguageSwitcher({ locale, localizedSlugs, currentSlug, dictionary }: LanguageSwitcherProps) {
  const items = SUPPORTED_LOCALES.filter((candidate) => candidate !== locale).flatMap((candidate) => {
    const slug = localizedSlugs[candidate];
    if (slug === undefined) {
      return [];
    }
    const href = localizePath(candidate, slug);
    return [
      <Link
        key={candidate}
        href={href || '/'}
        className="text-sm font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
        hrefLang={candidate}
        lang={candidate}
        rel="alternate"
        title={LOCALE_LABELS[candidate]}
        aria-label={`${dictionary.ariaLabel}: ${LOCALE_LABELS[candidate]}`}
      >
        {candidate.toUpperCase()}
      </Link>,
    ];
  });

  const hiddenDefault = localizedSlugs[DEFAULT_LOCALE] ?? currentSlug ?? '';

  return (
    <nav aria-label={dictionary.ariaLabel} className="flex items-center gap-3">
      <span className="sr-only">{dictionary.availableLabel}</span>
      <span className="sr-only">
        <Link href={localizePath(DEFAULT_LOCALE, hiddenDefault)} hrefLang={DEFAULT_LOCALE} lang={DEFAULT_LOCALE}>
          {DEFAULT_LOCALE.toUpperCase()}
        </Link>
      </span>
      {items.length > 0 ? items : null}
    </nav>
  );
}