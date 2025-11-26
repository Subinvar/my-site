import fs from 'fs';
import path from 'path';

import { defaultLocale, type Locale } from '@/lib/i18n';

type LocalizedRecord = Partial<Record<Locale, string | null | undefined>>;

type CatalogTaxonomyEntry = {
  value: string;
  label?: LocalizedRecord;
  isAuxiliaryCategory?: boolean;
};

type LegacyTaxonomyValue =
  | string
  | null
  | undefined
  | {
      name?: string | null | undefined;
      slug?: string | null | undefined;
    };

type CatalogTaxonomyEntryInput = {
  value?: LegacyTaxonomyValue;
  label?: LocalizedRecord;
  isAuxiliaryCategory?: boolean;
} | null;

type CatalogTaxonomy = {
  categories?: CatalogTaxonomyEntryInput[];
  processes?: CatalogTaxonomyEntryInput[];
  bases?: CatalogTaxonomyEntryInput[];
  fillers?: CatalogTaxonomyEntryInput[];
  auxiliaries?: CatalogTaxonomyEntryInput[];
};

type TaxonomyKey = 'categories' | 'processes' | 'bases' | 'fillers' | 'auxiliaries';

type TaxonomyEntryMap = {
  categories: CatalogTaxonomyEntry[];
  processes: CatalogTaxonomyEntry[];
  bases: CatalogTaxonomyEntry[];
  fillers: CatalogTaxonomyEntry[];
  auxiliaries: CatalogTaxonomyEntry[];
};

const TAXONOMY_DIRECTORIES: Record<TaxonomyKey, string> = {
  categories: 'content/catalog-categories',
  processes: 'content/catalog-processes',
  bases: 'content/catalog-bases',
  fillers: 'content/catalog-fillers',
  auxiliaries: 'content/catalog-auxiliaries',
};

function readJsonFile<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeValue(rawValue: LegacyTaxonomyValue): string | null {
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    return trimmed || null;
  }

  if (rawValue && typeof rawValue === 'object') {
    const { slug, name } = rawValue;
    const slugValue = typeof slug === 'string' ? slug.trim() : '';
    if (slugValue) {
      return slugValue;
    }
    const nameValue = typeof name === 'string' ? name.trim() : '';
    if (nameValue) {
      return nameValue;
    }
  }

  return null;
}

function coerceEntry(entry: CatalogTaxonomyEntryInput): CatalogTaxonomyEntry | null {
  if (!entry) {
    return null;
  }

  const value = normalizeValue(entry.value ?? null);
  if (!value) {
    return null;
  }

  return { ...entry, value } satisfies CatalogTaxonomyEntry;
}

function readEntriesFromDirectory(directory: string): CatalogTaxonomyEntry[] {
  const absoluteDir = path.join(process.cwd(), directory);

  let dirEntries: fs.Dirent[] = [];
  try {
    dirEntries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  } catch {
    return [];
  }

  return dirEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const candidatePath = path.join(absoluteDir, entry.name, 'index.json');
      const parsed = readJsonFile<CatalogTaxonomyEntryInput>(candidatePath);

      return coerceEntry(parsed);
    })
    .filter((entry): entry is CatalogTaxonomyEntry => Boolean(entry));
}

function normalizeEntries(entries: CatalogTaxonomyEntryInput[] | undefined): CatalogTaxonomyEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => coerceEntry(entry))
    .filter((entry): entry is CatalogTaxonomyEntry => Boolean(entry));
}

const taxonomyData: CatalogTaxonomy = Object.fromEntries(
  (Object.keys(TAXONOMY_DIRECTORIES) as TaxonomyKey[]).map((key) => [
    key,
    readEntriesFromDirectory(TAXONOMY_DIRECTORIES[key]),
  ])
) as CatalogTaxonomy;

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

export const CATALOG_TAXONOMY_VALUES = {
  categories: CATALOG_CATEGORIES,
  processes: CATALOG_PROCESSES,
  bases: CATALOG_BASES,
  fillers: CATALOG_FILLERS,
  auxiliaries: CATALOG_AUXILIARIES,
  auxiliaryCategory: AUXILIARY_CATEGORY,
} as const;

export type CatalogTaxonomyValues = typeof CATALOG_TAXONOMY_VALUES;

export function getCatalogTaxonomyValues(): CatalogTaxonomyValues {
  return CATALOG_TAXONOMY_VALUES;
}
