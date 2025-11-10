import Link from 'next/link';
import { getDictionary } from '@/lib/keystatic';
import { localeLabels, localizePath, type Locale, otherLocale } from '@/lib/i18n';

type LocaleSwitcherProps = {
  locale: Locale;
  entry?: {
    id: string;
    slugByLocale: Partial<Record<Locale, string | undefined>>;
  };
};

function resolveLocalizedSlug(slug: string | undefined | null): string {
  if (!slug) {
    return '';
  }
  return slug;
}

export async function LocaleSwitcher({ locale, entry }: LocaleSwitcherProps) {
  const dictionary = await getDictionary(locale);
  const alternate = otherLocale(locale);
  const alternateSlug = resolveLocalizedSlug(entry?.slugByLocale?.[alternate]);
  const href = localizePath(alternate, alternateSlug);

  const label = localeLabels[alternate];
  const ariaLabel = `${dictionary.common.languageSwitcher.ariaLabel}: ${label}`;

  return (
    <nav aria-label={dictionary.common.languageSwitcher.ariaLabel} className="flex items-center gap-3">
      <span className="sr-only">{dictionary.common.languageSwitcher.availableLabel}</span>
      <Link
        href={href}
        hrefLang={alternate}
        lang={alternate}
        rel="alternate"
        className="text-sm font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
        aria-label={ariaLabel}
        title={label}
      >
        {alternate.toUpperCase()}
      </Link>
    </nav>
  );
}