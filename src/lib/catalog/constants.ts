import taxonomySource from '../../../content/catalog-taxonomy/index.json';
import { defaultLocale, type Locale } from '@/lib/i18n';

type LocalizedRecord = Partial<Record<Locale, string | null | undefined>>;

type CatalogTaxonomyEntry = {
  value: string;
  label?: LocalizedRecord;
  isAuxiliaryCategory?: boolean;
} | null;

type CatalogTaxonomy = {
  categories?: CatalogTaxonomyEntry[];
  processes?: CatalogTaxonomyEntry[];
  bases?: CatalogTaxonomyEntry[];
  fillers?: CatalogTaxonomyEntry[];
  auxiliaries?: CatalogTaxonomyEntry[];
};

const taxonomyData = (taxonomySource as CatalogTaxonomy) ?? {};

function normalizeEntries(entries: CatalogTaxonomyEntry[] | undefined): CatalogTaxonomyEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries.filter((entry): entry is NonNullable<CatalogTaxonomyEntry> => {
    return Boolean(entry && typeof entry.value === 'string' && entry.value.trim());
  });
}

const categories = normalizeEntries(taxonomyData.categories);
const processes = normalizeEntries(taxonomyData.processes);
const bases = normalizeEntries(taxonomyData.bases);
const fillers = normalizeEntries(taxonomyData.fillers);
const auxiliaries = normalizeEntries(taxonomyData.auxiliaries);

function toValues(entries: CatalogTaxonomyEntry[]): readonly string[] {
  return entries.map((entry) => entry.value) as readonly string[];
}

function pickLabel(entry: CatalogTaxonomyEntry | undefined, locale: Locale): string {
  if (!entry) {
    return '';
  }
  const label = entry.label?.[locale];
  if (label && typeof label === 'string' && label.trim()) {
    return label;
  }
  const fallback = entry.label?.[defaultLocale];
  if (fallback && typeof fallback === 'string' && fallback.trim()) {
    return fallback;
  }
  return entry.value;
}

export const CATALOG_CATEGORIES = toValues(categories);
export const CATALOG_PROCESSES = toValues(processes);
export const CATALOG_BASES = toValues(bases);
export const CATALOG_FILLERS = toValues(fillers);
export const CATALOG_AUXILIARIES = toValues(auxiliaries);

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];
export type CatalogProcess = (typeof CATALOG_PROCESSES)[number];
export type CatalogBase = (typeof CATALOG_BASES)[number];
export type CatalogFiller = (typeof CATALOG_FILLERS)[number];
export type CatalogAuxiliary = (typeof CATALOG_AUXILIARIES)[number];

type TaxonomyKey = 'categories' | 'processes' | 'bases' | 'fillers' | 'auxiliaries';

type TaxonomyEntryMap = {
  categories: CatalogTaxonomyEntry[];
  processes: CatalogTaxonomyEntry[];
  bases: CatalogTaxonomyEntry[];
  fillers: CatalogTaxonomyEntry[];
  auxiliaries: CatalogTaxonomyEntry[];
};

const TAXONOMY_MAP: TaxonomyEntryMap = {
  categories,
  processes,
  bases,
  fillers,
  auxiliaries,
};

export function getCatalogTaxonomyLabel(
  key: TaxonomyKey,
  value: string,
  locale: Locale
): string | null {
  const entry = TAXONOMY_MAP[key].find((item) => item.value === value);
  if (!entry) {
    return null;
  }
  return pickLabel(entry, locale);
}

export function getCatalogTaxonomyOptions(
  locale: Locale
): {
  categories: ReadonlyArray<{ value: CatalogCategory; label: string }>;
  processes: ReadonlyArray<{ value: CatalogProcess; label: string }>;
  bases: ReadonlyArray<{ value: CatalogBase; label: string }>;
  fillers: ReadonlyArray<{ value: CatalogFiller; label: string }>;
  auxiliaries: ReadonlyArray<{ value: CatalogAuxiliary; label: string }>;
} {
  return {
    categories: categories.map((entry) => ({ value: entry.value, label: pickLabel(entry, locale) })),
    processes: processes.map((entry) => ({ value: entry.value, label: pickLabel(entry, locale) })),
    bases: bases.map((entry) => ({ value: entry.value, label: pickLabel(entry, locale) })),
    fillers: fillers.map((entry) => ({ value: entry.value, label: pickLabel(entry, locale) })),
    auxiliaries: auxiliaries.map((entry) => ({ value: entry.value, label: pickLabel(entry, locale) })),
  };
}

export const AUXILIARY_CATEGORY =
  categories.find((entry) => entry.isAuxiliaryCategory)?.value ?? 'auxiliary';
