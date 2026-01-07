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
  return resolveLocalizedValue(page?.title ?? null, locale) || (locale === 'ru' ? 'Каталог' : 'Catalog');
}

export function resolveDescription(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.description ?? null, locale);
}

export function resolveSearchPlaceholder(page: CatalogPageContent | null, locale: Locale): string {
  return (
    resolveLocalizedValue(page?.searchPlaceholder ?? null, locale) ||
    (locale === 'ru' ? 'Поиск по названию или артикулу' : 'Search by name or code')
  );
}

export function resolveSubmitLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.submitLabel ?? null, locale) || (locale === 'ru' ? 'Показать' : 'Show');
}

export function resolveResetLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.resetLabel ?? null, locale) || (locale === 'ru' ? 'Сбросить' : 'Reset');
}

export function resolveCategoryAllLabel(page: CatalogPageContent | null, locale: Locale): string {
  return (
    resolveLocalizedValue(page?.categoryAllLabel ?? null, locale) ||
    (locale === 'ru' ? 'Все категории' : 'All categories')
  );
}

export function resolveProcessAllLabel(page: CatalogPageContent | null, locale: Locale): string {
  return (
    resolveLocalizedValue(page?.processAllLabel ?? null, locale) ||
    (locale === 'ru' ? 'Все процессы' : 'All processes')
  );
}

export function resolveDetailLabel(page: CatalogPageContent | null, locale: Locale): string {
  return resolveLocalizedValue(page?.detailLabel ?? null, locale) || (locale === 'ru' ? 'Подробнее' : 'View details');
}

export function resolveRequestLabel(page: CatalogPageContent | null, locale: Locale): string {
  return (
    resolveLocalizedValue(page?.requestLabel ?? null, locale) ||
    (locale === 'ru' ? 'Запросить КП' : 'Request a quote')
  );
}

export function resolveEmptyState(page: CatalogPageContent | null, locale: Locale): string {
  return (
    resolveLocalizedValue(page?.emptyStateMessage ?? null, locale) ||
    (locale === 'ru'
      ? 'По выбранным параметрам ничего не найдено. Попробуйте снять часть фильтров или изменить запрос.'
      : 'No products match your filters. Try adjusting the search parameters.')
  );
}

export function resolveLoadMoreLabel(page: CatalogPageContent | null, locale: Locale): string {
  return (
    resolveLocalizedValue(page?.loadMoreLabel ?? null, locale) ||
    (locale === 'ru' ? 'Загрузить ещё' : 'Load more')
  );
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