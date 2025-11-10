export const locales = ['ru', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

export const fallbackLocale: Locale = defaultLocale;

export const localeLabels: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locales.find((candidate) => candidate !== locale) ?? defaultLocale;
}

const LOCALE_LANGUAGE_TAG: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

export function toLanguageTag(locale: Locale): string {
  return LOCALE_LANGUAGE_TAG[locale] ?? locale;
}

export function localizePath(locale: Locale, slug: string | string[] | undefined): string {
  const normalized = Array.isArray(slug)
    ? slug.filter(Boolean).join('/')
    : slug ?? '';
  const suffix = normalized ? `/${normalized}` : '';
  return `/${locale}${suffix}` || '/';
}

export function formatDate(
  date: string | number | Date | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string | null {
  if (!date) {
    return null;
  }

  const value = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  const languageTag = toLanguageTag(locale);
  const formatter = new Intl.DateTimeFormat(languageTag, options ?? { day: 'numeric', month: 'short', year: 'numeric' });
  return formatter.format(value);
}