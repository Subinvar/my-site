import Link from 'next/link';
import { SUPPORTED_LOCALES, type Locale, localizePath, DEFAULT_LOCALE } from '@/lib/i18n';

type LanguageSwitcherProps = {
  locale: Locale;
  localizedSlugs: Partial<Record<Locale, string>>;
  currentSlug?: string;
};

export function LanguageSwitcher({ locale, localizedSlugs, currentSlug }: LanguageSwitcherProps) {
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
      >
        {candidate.toUpperCase()}
      </Link>,
    ];
  });

  const hiddenDefault = localizedSlugs[DEFAULT_LOCALE] ?? currentSlug ?? '';

  return (
    <nav aria-label="Language switcher" className="flex items-center gap-3">
      <span className="sr-only">Доступные языки</span>
      <span className="sr-only">
        <Link href={localizePath(DEFAULT_LOCALE, hiddenDefault)} hrefLang={DEFAULT_LOCALE} lang={DEFAULT_LOCALE}>
          {DEFAULT_LOCALE.toUpperCase()}
        </Link>
      </span>
      {items.length > 0 ? items : null}
    </nav>
  );
}