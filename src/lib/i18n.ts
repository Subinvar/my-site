export const SUPPORTED_LOCALES = ["ru", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
};

export const FALLBACK_LOCALE: Locale = DEFAULT_LOCALE;

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && SUPPORTED_LOCALES.includes(value as Locale);
}

export function localizePath(locale: Locale, slug: string | string[] | undefined): string {
  const normalized = Array.isArray(slug)
    ? slug.filter(Boolean).join("/")
    : (slug ?? "");
  const suffix = normalized ? `/${normalized}` : "";
  return `/${locale}${suffix}`;
}