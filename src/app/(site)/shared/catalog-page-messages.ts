import type { CatalogFiltersProps } from '@/components/catalog/catalog-filters';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';
import type { CatalogPageContent } from '@/lib/keystatic';

function resolveLocalizedValue(
  record: Partial<Record<Locale, string>> | null | undefined,
  locale: Locale
): string {
  const localized = record?.[locale];
  if (localized && localized.trim()) {
    return localized;
  }
  const fallback = record?.[defaultLocale];
  if (fallback && fallback.trim()) {
    return fallback;
  }
  for (const candidate of locales) {
    const value = record?.[candidate];
    if (value && value.trim()) {
      return value;
    }
  }
  return '';
}

export function resolveHeading(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.title ?? null, locale);
}

export function resolveDescription(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.description ?? null, locale);
}

export function resolveSubmitLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.submitLabel ?? null, locale);
}

export function resolveResetLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.resetLabel ?? null, locale);
}

export function resolveDetailLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.detailLabel ?? null, locale);
}

export function resolveRequestLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.requestLabel ?? null, locale);
}

export function resolveEmptyState(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.emptyStateMessage ?? null, locale);
}

export function resolveGroupLabels(
  page: CatalogPageContent | null,
  locale: Locale
): CatalogFiltersProps['groupLabels'] {
  const defaults: CatalogFiltersProps['groupLabels'] = {
    category: 'Категория',
    process: 'Процесс',
    base: 'Основа',
    filler: 'Наполнитель',
    metal: 'Металл',
    auxiliary: 'Вспомогательные',
  };
  const groupLabels = page?.groupLabels ?? null;

  return {
    category: resolveLocalizedValue(groupLabels?.category ?? null, locale) || defaults.category,
    process: resolveLocalizedValue(groupLabels?.process ?? null, locale) || defaults.process,
    base: resolveLocalizedValue(groupLabels?.base ?? null, locale) || defaults.base,
    filler: resolveLocalizedValue(groupLabels?.filler ?? null, locale) || defaults.filler,
    metal: resolveLocalizedValue(groupLabels?.metal ?? null, locale) || defaults.metal,
    auxiliary: resolveLocalizedValue(groupLabels?.auxiliary ?? null, locale) || defaults.auxiliary,
  } satisfies CatalogFiltersProps['groupLabels'];
}
