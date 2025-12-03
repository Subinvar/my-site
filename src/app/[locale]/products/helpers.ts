import type { FilterState } from '@/app/(site)/shared/catalog-filtering';

export function toSlug(value: string): string {
  return encodeURIComponent(value);
}

export function matchOptionBySlug<T extends { value: string }>(
  options: ReadonlyArray<Readonly<T>>,
  slug: string
): Readonly<T> | null {
  const decodedSlug = decodeURIComponent(slug);
  return (
    options.find((option) => option.value === decodedSlug || toSlug(option.value) === slug) ?? null
  );
}

export function sortByOrderAndLabel<T extends { order?: number | null; label: string }>(
  a: T,
  b: T
): number {
  const orderA = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
  const orderB = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return a.label.localeCompare(b.label);
}

export function toFilter<T extends string>(values: readonly T[]): FilterState['category'] {
  return { values: [...values], lookup: new Set(values) } as FilterState['category'];
}
