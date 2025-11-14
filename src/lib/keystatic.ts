import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { createReader } from '@keystatic/core/reader';
import type { Node as MarkdocNode } from '@markdoc/markdoc';
import config from '../../keystatic.config';
import { defaultLocale, locales, type Locale } from './i18n';
import { isLocale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';
import type { MarkdocContent, ResolvedMarkdocContent } from '@/lib/markdoc';
import {
  CATALOG_BASES,
  CATALOG_CATEGORIES,
  CATALOG_AUXILIARIES,
  CATALOG_FILLERS,
  CATALOG_PROCESSES,
  type CatalogBase,
  type CatalogCategory,
  type CatalogAuxiliary,
  type CatalogFiller,
  type CatalogProcess,
} from './catalog/constants';

const ROOT_SLUG_PLACEHOLDER = '__root__';

export type DocumentType = 'certificate' | 'tds' | 'msds' | 'brochure';
export type DocumentLanguage = 'ru' | 'en';

const CATALOG_CATEGORY_SET = new Set<string>(CATALOG_CATEGORIES);
const CATALOG_PROCESS_SET = new Set<string>(CATALOG_PROCESSES);
const CATALOG_BASE_SET = new Set<string>(CATALOG_BASES);
const CATALOG_FILLER_SET = new Set<string>(CATALOG_FILLERS);
const CATALOG_AUXILIARY_SET = new Set<string>(CATALOG_AUXILIARIES);
const DOCUMENT_TYPE_SET = new Set<DocumentType>(['certificate', 'tds', 'msds', 'brochure']);
const DOCUMENT_LANGUAGE_SET = new Set<DocumentLanguage>(['ru', 'en']);
const DOCUMENT_TYPE_ORDER: DocumentType[] = ['certificate', 'tds', 'msds', 'brochure'];

export const DOCUMENT_TYPES: readonly DocumentType[] = DOCUMENT_TYPE_ORDER;
export const DOCUMENT_LANGUAGES: readonly DocumentLanguage[] = ['ru', 'en'];

const getReader = cache(() => createReader(process.cwd(), config));

async function readJsonFile<T>(absolutePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(absolutePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readFallbackCollection<T>(relativeDir: string): Promise<Array<{ key: string; entry: T }>> {
  const directory = path.join(process.cwd(), relativeDir);
  const dirEntries = await fs.readdir(directory, { withFileTypes: true }).catch(() => null);
  if (!dirEntries) {
    return [];
  }

  const results: Array<{ key: string; entry: T }> = [];

  for (const entry of dirEntries) {
    let filePath: string | null = null;
    let key: string;
    let entryDir: string | null = null;

    if (entry.isDirectory()) {
      filePath = path.join(directory, entry.name, 'index.json');
      key = entry.name;
      entryDir = path.join(directory, entry.name);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      filePath = path.join(directory, entry.name);
      key = entry.name.replace(/\.json$/i, '');
    } else {
      continue;
    }

    const data = await readJsonFile<T>(filePath);
    if (!data) {
      continue;
    }

    normalizeEntrySlugs(data);

    await hydrateLocalizedMarkdoc(entryDir, data);

    results.push({ key, entry: data });
  }

  return results;
}

async function readFallbackSingleton<T>(relativePath: string): Promise<T | null> {
  const absolute = path.join(process.cwd(), relativePath);
  return readJsonFile<T>(absolute);
}

function normalizeEntrySlugs(entry: unknown): void {
  if (!entry || typeof entry !== 'object') {
    return;
  }
  const record = entry as { slug?: unknown; path?: unknown };
  if (record.slug && typeof record.slug === 'object') {
    normalizeSlugRecord(record.slug as Record<string, unknown>);
  }
  if (record.path && typeof record.path === 'object') {
    normalizeSlugRecord(record.path as Record<string, unknown>);
  }
}

async function hydrateLocalizedMarkdoc(entryDir: string | null, entry: unknown): Promise<void> {
  if (!entryDir) {
    return;
  }
  if (!entry || typeof entry !== 'object') {
    return;
  }
  const record = entry as { content?: unknown };
  const localized = record.content;
  if (!localized || typeof localized !== 'object') {
    return;
  }
  const localizedRecord = localized as Record<string, unknown>;
  for (const locale of locales) {
    const current = localizedRecord[locale];
    if (current && typeof current === 'object') {
      if ('content' in (current as Record<string, unknown>) || 'node' in (current as Record<string, unknown>)) {
        continue;
      }
    }
    if (typeof current === 'string') {
      continue;
    }
    const filePath = path.join(entryDir, 'content', `${locale}.mdoc`);
    const file = await fs.readFile(filePath, 'utf8').catch(() => null);
    if (file !== null) {
      localizedRecord[locale] = { content: file };
      continue;
    }
    if (current === undefined) {
      localizedRecord[locale] = null;
    }
  }
}

function normalizeSlugRecord(record: Record<string, unknown>): void {
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (typeof value === 'string') {
      if (!value.trim()) {
        record[key] = ROOT_SLUG_PLACEHOLDER;
      }
      continue;
    }
    if (typeof value === 'object' && value !== null && 'slug' in value) {
      const nested = value as { slug?: string | null };
      if (typeof nested.slug === 'string' && !nested.slug.trim()) {
        nested.slug = ROOT_SLUG_PLACEHOLDER;
      }
    }
  }
}

function normalizeDateTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const minutesPrecisionMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})$/);
  if (minutesPrecisionMatch) {
    const candidate = `${minutesPrecisionMatch[1]}:00.000Z`;
    const date = new Date(candidate);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

type Localized<T> = Partial<Record<Locale, T | null | undefined>>;

type RawMedia =
  | string
  | { src?: string | null; width?: number | null; height?: number | null }
  | null
  | undefined;

type RawSeoImage = {
  image?: RawMedia;
  alt?: string | null;
} | null;

type RawSeoGroup = {
  title?: Localized<string>;
  description?: Localized<string>;
  ogTitle?: Localized<string>;
  ogDescription?: Localized<string>;
  ogImage?: RawSeoImage;
  canonicalOverride?: string | null;
} | null;

type RawMarkdocValue = string | { content?: string | null } | { node?: MarkdocNode | null } | null;

type RawPageEntry = {
  id?: string | null;
  slug?: Localized<string | { slug?: string | null } | null>;
  title?: Localized<string>;
  description?: Localized<string>;
  content?: Localized<RawMarkdocValue>;
  seo?: RawSeoGroup;
  published?: boolean | null;
  status?: 'draft' | 'published';
  updatedAt?: string | null;
  excerpt?: Localized<string>;
  slugKey?: string | null;
};

type RawPostEntry = RawPageEntry & {
  date?: string | null;
  tags?: string[] | null;
  cover?: {
    image?: RawMedia;
    alt?: Localized<string>;
  } | null;
};

type RawCatalogEntry = {
  id?: string | null;
  slug?: Localized<string | { slug?: string | null } | null>;
  title?: Localized<string>;
  excerpt?: Localized<string>;
  content?: Localized<RawMarkdocValue>;
  category?: string | null;
  process?: string[] | null;
  base?: string[] | null;
  filler?: string[] | null;
  auxiliary?: string[] | null;
  image?: RawMedia;
  docs?: string | null;
  published?: boolean | null;
  status?: 'draft' | 'published';
  updatedAt?: string | null;
  slugKey?: string | null;
};

type RawDocumentEntry = {
  id?: string | null;
  title?: Localized<string>;
  file?: RawMedia;
  type?: string | null;
  lang?: string | null;
  relatedProducts?: string[] | string | null;
  published?: boolean | null;
  status?: 'draft' | 'published';
  updatedAt?: string | null;
  slugKey?: string | null;
};

type DocumentsPageSingleton = {
  title?: Localized<string>;
  description?: Localized<string>;
  ogImage?: RawSeoImage;
};

type NavigationEntry = {
  id?: string | null;
  label?: Localized<string>;
  path?: Localized<string>;
  externalUrl?: string | null;
  newTab?: boolean | null;
  order?: number | null;
};

export type SeoImage = {
  src: string;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
};

export type ResolvedSeo = {
  title?: string | null;
  description?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: SeoImage | null;
  canonicalOverride?: string | null;
};

export type SiteSeo = Omit<ResolvedSeo, 'canonicalOverride'> & {
  canonicalBase: string | null;
  twitterHandle: string | null;
};

export type SiteContent = {
  locale: Locale;
  name: string | null;
  tagline: string | null;
  contacts: {
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  seo: SiteSeo;
  domain: string | null;
  robots: { index: boolean; follow: boolean };
};

export type NavigationLink = {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  newTab: boolean;
  localizedPath?: Localized<string>;
};

export type Navigation = {
  header: NavigationLink[];
  footer: NavigationLink[];
};

export type PageContent = {
  id: string;
  locale: Locale;
  title: string;
  slug: string;
  slugByLocale: Partial<Record<Locale, string>>;
  content: MarkdocContent;
  description: string | null;
  seo: ResolvedSeo | null;
  excerpt: string | null;
  updatedAt?: string | null;
};

export type PageSummary = {
  id: string;
  slugByLocale: Partial<Record<Locale, string>>;
  published: boolean;
  updatedAt?: string | null;
};

export type PostSummary = {
  id: string;
  slugByLocale: Partial<Record<Locale, string>>;
  published: boolean;
  date?: string | null;
  updatedAt?: string | null;
};

export type PostContent = PageContent & {
  date?: string | null;
  tags: string[];
  cover?: { src: string; alt?: string | null } | null;
};

export type CatalogImage = {
  src: string;
  width?: number | null;
  height?: number | null;
};

export type CatalogListItem = {
  id: string;
  locale: Locale;
  slug: string;
  slugByLocale: Partial<Record<Locale, string>>;
  title: string;
  excerpt: string | null;
  category: CatalogCategory | null;
  process: CatalogProcess[];
  base: CatalogBase[];
  filler: CatalogFiller[];
  auxiliary: CatalogAuxiliary[];
  image: CatalogImage | null;
  docs: string | null;
  updatedAt?: string | null;
};

export type CatalogItem = CatalogListItem & {
  content: MarkdocContent;
};

export type CatalogSummary = {
  id: string;
  slugByLocale: Partial<Record<Locale, string>>;
  published: boolean;
  updatedAt?: string | null;
};

export type Document = {
  id: string;
  title: Partial<Record<Locale, string>>;
  type: DocumentType;
  lang: DocumentLanguage;
  file: string | null;
  fileName: string | null;
  fileExtension: string | null;
  fileSize: number | null;
  relatedProductIds: string[];
  updatedAt?: string | null;
};

export type DocumentsPageContent = {
  title: Partial<Record<Locale, string>>;
  description: Partial<Record<Locale, string>>;
  ogImage: SeoImage | null;
};

function toOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeImageAsset(value: RawMedia): { src: string; width?: number | null; height?: number | null } | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return { src: normalizeImagePath(trimmed) };
  }
  const src = typeof value.src === 'string' ? value.src.trim() : '';
  if (!src) {
    return null;
  }
  const width = typeof value.width === 'number' ? value.width : undefined;
  const height = typeof value.height === 'number' ? value.height : undefined;
  return { src: normalizeImagePath(src), width, height };
}

function normalizeImagePath(src: string): string {
  if (/^https?:\/\//.test(src)) {
    return src;
  }
  const normalized = src.replace(/^\/+/g, '');
  return `/${normalized}`;
}

async function resolveUploadSize(filePath: string | null): Promise<number | null> {
  if (!filePath || /^https?:\/\//i.test(filePath)) {
    return null;
  }
  const withoutLeading = filePath.replace(/^\/+/g, '');
  const withoutQuery = withoutLeading.split('?')[0]?.split('#')[0] ?? '';
  const relative = withoutQuery.startsWith('public/')
    ? withoutQuery.slice('public/'.length)
    : withoutQuery;
  const absolute = path.join(process.cwd(), 'public', relative);
  try {
    const stats = await fs.stat(absolute);
    if (!stats.isFile()) {
      return null;
    }
    return stats.size;
  } catch {
    return null;
  }
}

function mapSeoImage(value: RawSeoImage): SeoImage | null {
  if (!value) {
    return null;
  }
  const asset = normalizeImageAsset(value.image);
  if (!asset) {
    return null;
  }
  return {
    src: asset.src,
    width: asset.width,
    height: asset.height,
    alt: toOptionalString(value.alt ?? undefined) ?? undefined,
  } satisfies SeoImage;
}

function mapResolvedSeo(value: RawSeoGroup | undefined | null, locale: Locale): ResolvedSeo | null {
  if (!value) {
    return null;
  }
  const title = toOptionalString(pickLocalized(value.title, locale));
  const description = toOptionalString(pickLocalized(value.description, locale));
  const ogTitle = toOptionalString(pickLocalized(value.ogTitle, locale));
  const ogDescription = toOptionalString(pickLocalized(value.ogDescription, locale));
  const ogImage = mapSeoImage(value.ogImage ?? null);
  const canonicalOverride = toOptionalString(value.canonicalOverride ?? undefined);
  if (!title && !description && !ogTitle && !ogDescription && !ogImage && !canonicalOverride) {
    return null;
  }
  return {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    canonicalOverride,
  } satisfies ResolvedSeo;
}

function isPublished(entry: RawPageEntry | RawPostEntry | RawCatalogEntry | RawDocumentEntry): boolean {
  if (typeof entry.published === 'boolean') {
    return entry.published;
  }
  return (entry.status ?? 'draft') === 'published';
}

function pickLocalized<T>(value: Localized<T> | undefined, locale: Locale): T | undefined {
  if (!value) {
    return undefined;
  }
  const localized = value[locale];
  if (localized !== undefined && localized !== null) {
    return localized ?? undefined;
  }
  const fallback = value[defaultLocale];
  return fallback ?? undefined;
}

function normalizeSlug(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === ROOT_SLUG_PLACEHOLDER) {
      return '';
    }
    return trimmed.replace(/^\/+|\/+$/g, '');
  }
  if (typeof value === 'object' && value !== null && 'slug' in value) {
    return normalizeSlug((value as { slug?: string | null }).slug ?? null);
  }
  return null;
}

function mapLocalizedSlugs(slugs?: Localized<string | { slug?: string | null } | null>): Partial<Record<Locale, string>> {
  const record: Partial<Record<Locale, string>> = {};
  if (!slugs) {
    return record;
  }
  for (const locale of locales) {
    const slug = normalizeSlug(slugs[locale] ?? null);
    if (slug === null || slug === undefined) {
      continue;
    }
    record[locale] = slug;
  }
  return record;
}

function mapLocalizedTextRecord(value?: Localized<string>): Partial<Record<Locale, string>> {
  const record: Partial<Record<Locale, string>> = {};
  if (!value) {
    return record;
  }
  for (const locale of locales) {
    const text = toOptionalString(value[locale] ?? undefined);
    if (!text) {
      continue;
    }
    record[locale] = text;
  }
  return record;
}

function pickFirstLocalizedText(record: Partial<Record<Locale, string>>): string | null {
  const orderedLocales = [defaultLocale, ...locales.filter((candidate) => candidate !== defaultLocale)];
  for (const locale of orderedLocales) {
    const value = record[locale];
    if (value && value.trim()) {
      return value;
    }
  }
  return null;
}

function normalizeFilePath(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return normalizeImagePath(trimmed);
  }
  if (typeof value === 'object' && value !== null) {
    if ('src' in value && typeof (value as { src?: string | null }).src === 'string') {
      return normalizeFilePath((value as { src?: string | null }).src ?? null);
    }
    if ('path' in value && typeof (value as { path?: string | null }).path === 'string') {
      return normalizeFilePath((value as { path?: string | null }).path ?? null);
    }
  }
  return null;
}

function mapRelationshipValues(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const entry of value) {
      let candidate: string | null = null;
      if (typeof entry === 'string') {
        candidate = entry;
      } else if (entry && typeof entry === 'object' && 'value' in entry) {
        const record = entry as { value?: string | null };
        if (typeof record.value === 'string') {
          candidate = record.value;
        }
      }
      if (typeof candidate !== 'string') {
        continue;
      }
      const trimmed = candidate.trim();
      if (!trimmed || seen.has(trimmed)) {
        continue;
      }
      seen.add(trimmed);
      result.push(trimmed);
    }
    return result;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function filterValidValues<T extends string>(values: unknown, allowed: Set<string>): T[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const seen = new Set<string>();
  const result: T[] = [];
  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (!allowed.has(trimmed) || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed as T);
  }
  return result;
}

function ensureUniqueLocalizedSlugs<T extends { slug?: Localized<string | { slug?: string | null } | null> }>(
  entries: Array<{ entry: T; key: string }>,
  collection: string
): void {
  const seenByLocale = new Map<Locale, Map<string, string>>();
  for (const locale of locales) {
    seenByLocale.set(locale, new Map());
  }

  for (const { entry, key } of entries) {
    const slugByLocale = mapLocalizedSlugs(entry.slug);
    for (const locale of locales) {
      const slug = slugByLocale[locale];
      if (!slug) {
        continue;
      }
      const localeMap = seenByLocale.get(locale);
      if (!localeMap) {
        continue;
      }
      const existing = localeMap.get(slug);
      if (existing) {
        throw new Error(
          `Duplicate slug "${slug}" for locale "${locale}" in collection "${collection}" (entries "${existing}" and "${key}").`
        );
      }
      localeMap.set(slug, key);
    }
  }
}

async function readMarkdoc(
  reference: string | { content?: string | null } | { node?: MarkdocNode | null } | null | undefined
): Promise<ResolvedMarkdocContent | null> {
  if (!reference) {
    return null;
  }
  if (typeof reference === 'object' && reference !== null) {
    if ('node' in reference && reference.node) {
      return { node: reference.node } satisfies ResolvedMarkdocContent;
    }
    if ('content' in reference && typeof reference.content === 'string') {
      return reference.content;
    }
  }
  const raw = typeof reference === 'string' ? reference : null;
  if (!raw) {
    return null;
  }
  const normalized = raw.startsWith('content/') ? raw : `content/${raw.replace(/^\/+/, '')}`;
  const absolute = path.join(process.cwd(), normalized);
  try {
    return await fs.readFile(absolute, 'utf8');
  } catch {
    return null;
  }
}

async function resolveLocalizedContent(
  content: Localized<RawMarkdocValue> | undefined,
  locale: Locale
): Promise<MarkdocContent> {
  if (!content) {
    return null;
  }
  const exact = await readMarkdoc(content[locale] ?? null);
  if (exact) {
    return exact;
  }
  if (locale === defaultLocale) {
    return null;
  }
  return readMarkdoc(content[defaultLocale] ?? null);
}

type SiteSingleton = {
  siteName?: Localized<string>;
  brand?: {
    siteName?: Localized<string>;
    tagline?: Localized<string>;
    contacts?: {
      email?: string | null;
      phone?: string | null;
      address?: Localized<string>;
    } | null;
  } | null;
  tagline?: Localized<string>;
  contacts?: {
    email?: string | null;
    phone?: string | null;
    address?: Localized<string>;
  } | null;
  seo?: {
    title?: Localized<string>;
    description?: Localized<string>;
    ogTitle?: Localized<string>;
    ogDescription?: Localized<string>;
    ogImage?: RawSeoImage;
    canonicalBase?: string | null;
    twitterHandle?: string | null;
  } | null;
  meta?: {
    domain?: string | null;
    robots?: {
      index?: boolean | null;
      follow?: boolean | null;
    } | null;
  } | null;
};

type NavigationSingleton = {
  headerLinks?: NavigationEntry[];
  footerLinks?: NavigationEntry[];
};

const readSiteSingleton = cache(async (): Promise<SiteSingleton | null> => {
  const reader = getReader();
  try {
    const site = await reader.singletons.site.read();
    if (site) {
      return site as SiteSingleton;
    }
  } catch {
    // fall back to file system
  }
  return (await readFallbackSingleton<SiteSingleton>('content/site/index.json')) ?? null;
});

const readNavigationSingleton = cache(async (): Promise<NavigationSingleton | null> => {
  const reader = getReader();
  try {
    const navigation = await reader.singletons.navigation.read();
    if (navigation) {
      return navigation as NavigationSingleton;
    }
  } catch {
    // fall back to file system
  }
  return (await readFallbackSingleton<NavigationSingleton>('content/navigation/index.json')) ?? null;
});

const readDocumentsPageSingleton = cache(async (): Promise<DocumentsPageSingleton | null> => {
  const reader = getReader();
  try {
    const documentsPage = await reader.singletons.documentsPage.read();
    if (documentsPage) {
      return documentsPage as DocumentsPageSingleton;
    }
  } catch {
    // fall back to file system
  }
  return (await readFallbackSingleton<DocumentsPageSingleton>('content/documents-page/index.json')) ?? null;
});

const readPagesCollection = cache(async () => {
  const reader = getReader();
  try {
    const entries = await reader.collections.pages.all({ resolveLinkedFiles: true });
    if (entries.length > 0) {
      return entries.map(({ slug, entry }) => ({ key: slug, entry: entry as RawPageEntry }));
    }
  } catch {
    // fall back to file system
  }
  return readFallbackCollection<RawPageEntry>('content/pages');
});

const readPostsCollection = cache(async () => {
  const reader = getReader();
  try {
    const entries = await reader.collections.posts.all({ resolveLinkedFiles: true });
    if (entries.length > 0) {
      return entries.map(({ slug, entry }) => ({ key: slug, entry: entry as RawPostEntry }));
    }
  } catch {
    // fall back to file system
  }
  return readFallbackCollection<RawPostEntry>('content/posts');
});

const readCatalogCollection = cache(async () => {
  const reader = getReader();
  try {
    const entries = await reader.collections.catalog.all({ resolveLinkedFiles: true });
    if (entries.length > 0) {
      const mapped = entries.map(({ slug, entry }) => ({ key: slug, entry: entry as RawCatalogEntry }));
      ensureUniqueLocalizedSlugs(mapped, 'catalog');
      return mapped;
    }
  } catch {
    // fall back to file system
  }
  const fallback = await readFallbackCollection<RawCatalogEntry>('content/catalog');
  ensureUniqueLocalizedSlugs(fallback, 'catalog');
  return fallback;
});

const readDocumentsCollection = cache(async () => {
  const reader = getReader();
  try {
    const entries = await reader.collections.documents.all({ resolveLinkedFiles: true });
    if (entries.length > 0) {
      return entries.map(({ slug, entry }) => ({ key: slug, entry: entry as RawDocumentEntry }));
    }
  } catch {
    // fall back to file system
  }
  return readFallbackCollection<RawDocumentEntry>('content/documents');
});

function resolveNavigationLinks(
  links: NavigationEntry[] | undefined,
  locale: Locale
): NavigationLink[] {
  if (!Array.isArray(links)) {
    return [];
  }
  const withOrder = links
    .map((link, index) => {
      const id = toOptionalString(link.id) ?? `link-${index}`;
      const label = pickLocalized(link.label, locale) ?? '';
      const localizedPath = link.path;
      const pathValue = localizedPath ? pickLocalized(localizedPath, locale) : undefined;
      const href = toOptionalString(link.externalUrl) ?? (pathValue ? buildInternalPath(locale, pathValue) : null);
      const isExternal = Boolean(link.externalUrl && toOptionalString(link.externalUrl));
      if (!href) {
        return null;
      }
      const order = typeof link.order === 'number' ? link.order : Number.POSITIVE_INFINITY;
      const orderedLink: NavigationLink & { order: number } = {
        id,
        label: label || href,
        href,
        isExternal,
        newTab: Boolean(link.newTab),
        localizedPath,
        order,
      };
      return orderedLink;
    })
    .filter((value): value is NavigationLink & { order: number } => value !== null)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  return withOrder.map(({ id, label, href, isExternal, newTab, localizedPath }) => ({
    id,
    label,
    href,
    isExternal,
    newTab,
    localizedPath,
  } satisfies NavigationLink));
}

function buildInternalPath(locale: Locale, pathValue: string): string {
  const normalized = pathValue.trim().replace(/^\/+|\/+$/g, '');

  if (!normalized) {
    return buildPath(locale);
  }

  const segments = normalized.split('/').filter(Boolean);
  const [firstSegment] = segments;
  if (firstSegment && isLocale(firstSegment)) {
    return `/${segments.join('/')}`;
  }

  return buildPath(locale, segments);
}

function computeEntryId(
  entry: RawPageEntry | RawPostEntry | RawCatalogEntry | RawDocumentEntry,
  fallback: string
): string {
  const id = toOptionalString(entry.id ?? undefined);
  if (id) {
    return id;
  }
  const slugFallback = toOptionalString(entry.slugKey ?? undefined);
  if (slugFallback) {
    return slugFallback;
  }
  return fallback;
}

export async function getSite(locale: Locale): Promise<SiteContent> {
  const site = await readSiteSingleton();
  const seoGroup = site?.seo ?? null;
  const resolvedSeo = mapResolvedSeo(seoGroup, locale);
  const contacts = site?.contacts ?? site?.brand?.contacts ?? {};
  return {
    locale,
    name: pickLocalized(site?.siteName ?? site?.brand?.siteName, locale) ?? null,
    tagline: pickLocalized(site?.tagline ?? site?.brand?.tagline, locale) ?? null,
    contacts: {
      email: toOptionalString(contacts.email ?? undefined),
      phone: toOptionalString(contacts.phone ?? undefined),
      address: pickLocalized(contacts.address, locale) ?? null,
    },
    seo: {
      title: resolvedSeo?.title ?? null,
      description: resolvedSeo?.description ?? null,
      ogTitle: resolvedSeo?.ogTitle ?? null,
      ogDescription: resolvedSeo?.ogDescription ?? null,
      ogImage: resolvedSeo?.ogImage ?? null,
      canonicalBase: toOptionalString(seoGroup?.canonicalBase ?? undefined),
      twitterHandle: toOptionalString(seoGroup?.twitterHandle ?? undefined),
    },
    domain: toOptionalString(site?.meta?.domain ?? undefined),
    robots: {
      index: site?.meta?.robots?.index !== false,
      follow: site?.meta?.robots?.follow !== false,
    },
  } satisfies SiteContent;
}

export async function getNavigation(locale: Locale): Promise<Navigation> {
  const navigation = await readNavigationSingleton();
  return {
    header: resolveNavigationLinks(navigation?.headerLinks, locale),
    footer: resolveNavigationLinks(navigation?.footerLinks, locale),
  } satisfies Navigation;
}

export async function getPageById(id: string, locale: Locale): Promise<PageContent | null> {
  const entries = await readPagesCollection();
  const entryRecord = entries.find(({ entry, key }) => {
    const entryId = computeEntryId(entry, key);
    return entryId === id;
  });
  if (!entryRecord) {
    return null;
  }
  if (!isPublished(entryRecord.entry)) {
    return null;
  }
  const slugByLocale = mapLocalizedSlugs(entryRecord.entry.slug);
  const slug = slugByLocale[locale] ?? '';
  const title = pickLocalized(entryRecord.entry.title, locale) ?? '';
  const content = await resolveLocalizedContent(entryRecord.entry.content, locale);
  const seo = mapResolvedSeo(entryRecord.entry.seo ?? null, locale);
  const description = pickLocalized(entryRecord.entry.description, locale) ?? null;
  const excerpt = pickLocalized(entryRecord.entry.excerpt, locale) ?? null;
  return {
    id,
    locale,
    title,
    slug,
    slugByLocale,
    content,
    description,
    seo,
    excerpt,
    updatedAt: normalizeDateTime(entryRecord.entry.updatedAt),
  } satisfies PageContent;
}

export async function getAllPages(): Promise<PageSummary[]> {
  const entries = await readPagesCollection();
  return entries.map(({ entry, key }) => {
    const id = computeEntryId(entry, key);
    const slugByLocale = mapLocalizedSlugs(entry.slug);
    return {
      id,
      slugByLocale,
      published: isPublished(entry),
      updatedAt: normalizeDateTime(entry.updatedAt),
    } satisfies PageSummary;
  });
}

export async function getPageBySlug(slug: string, locale: Locale): Promise<PageContent | null> {
  const entries = await readPagesCollection();
  const record = entries.find(({ entry }) => {
    const slugByLocale = mapLocalizedSlugs(entry.slug);
    return slugByLocale[locale] === slug;
  });
  if (!record) {
    return null;
  }
  if (!isPublished(record.entry)) {
    return null;
  }
  const slugByLocale = mapLocalizedSlugs(record.entry.slug);
  const title = pickLocalized(record.entry.title, locale) ?? '';
  const content = await resolveLocalizedContent(record.entry.content, locale);
  const seo = mapResolvedSeo(record.entry.seo ?? null, locale);
  const description = pickLocalized(record.entry.description, locale) ?? null;
  const excerpt = pickLocalized(record.entry.excerpt, locale) ?? null;
  return {
    id: computeEntryId(record.entry, record.key),
    locale,
    title,
    slug,
    slugByLocale,
    content,
    description,
    seo,
    excerpt,
    updatedAt: normalizeDateTime(record.entry.updatedAt),
  } satisfies PageContent;
}

export async function getAllPosts(): Promise<PostSummary[]> {
  const entries = await readPostsCollection();
  return entries.map(({ entry, key }) => {
    const id = computeEntryId(entry, key);
    const slugByLocale = mapLocalizedSlugs(entry.slug);
    return {
      id,
      slugByLocale,
      published: isPublished(entry),
      date: normalizeDateTime(entry.date),
      updatedAt: normalizeDateTime(entry.updatedAt),
    } satisfies PostSummary;
  });
}

function mapCatalogListItem(entry: RawCatalogEntry, key: string, locale: Locale): CatalogListItem | null {
  const slugByLocale = mapLocalizedSlugs(entry.slug);
  const slug = slugByLocale[locale];
  if (!slug) {
    return null;
  }

  const title = pickLocalized(entry.title, locale) ?? pickLocalized(entry.title, defaultLocale) ?? slug;
  const excerpt = pickLocalized(entry.excerpt, locale) ?? pickLocalized(entry.excerpt, defaultLocale) ?? null;
  const category = typeof entry.category === 'string' && CATALOG_CATEGORY_SET.has(entry.category)
    ? (entry.category as CatalogCategory)
    : null;
  const process = filterValidValues<CatalogProcess>(entry.process, CATALOG_PROCESS_SET);
  const base = filterValidValues<CatalogBase>(entry.base, CATALOG_BASE_SET);
  const filler = filterValidValues<CatalogFiller>(entry.filler, CATALOG_FILLER_SET);
  const auxiliary = filterValidValues<CatalogAuxiliary>(entry.auxiliary, CATALOG_AUXILIARY_SET);
  const imageAsset = normalizeImageAsset(entry.image ?? null);
  const image = imageAsset
    ? ({ src: imageAsset.src, width: imageAsset.width, height: imageAsset.height } satisfies CatalogImage)
    : null;
  const docs = toOptionalString(entry.docs ?? undefined);

  return {
    id: computeEntryId(entry, key),
    locale,
    slug,
    slugByLocale,
    title,
    excerpt,
    category,
    process,
    base,
    filler,
    auxiliary,
    image,
    docs,
    updatedAt: normalizeDateTime(entry.updatedAt),
  } satisfies CatalogListItem;
}

export async function getPostBySlug(slug: string, locale: Locale): Promise<PostContent | null> {
  const entries = await readPostsCollection();
  const record = entries.find(({ entry }) => {
    const slugByLocale = mapLocalizedSlugs(entry.slug);
    return slugByLocale[locale] === slug;
  });
  if (!record) {
    return null;
  }
  if (!isPublished(record.entry)) {
    return null;
  }
  const slugByLocale = mapLocalizedSlugs(record.entry.slug);
  const title = pickLocalized(record.entry.title, locale) ?? '';
  const content = await resolveLocalizedContent(record.entry.content, locale);
  const seo = mapResolvedSeo(record.entry.seo ?? null, locale);
  const description = pickLocalized(record.entry.description, locale) ?? null;
  const excerpt = pickLocalized(record.entry.excerpt, locale) ?? null;
  const coverAsset = normalizeImageAsset(record.entry.cover?.image);
  const cover = coverAsset
    ? { src: coverAsset.src, alt: pickLocalized(record.entry.cover?.alt, locale) ?? null }
    : null;
  return {
    id: computeEntryId(record.entry, record.key),
    locale,
    title,
    slug,
    slugByLocale,
    content,
    description,
    seo,
    excerpt,
    updatedAt: normalizeDateTime(record.entry.updatedAt),
    date: normalizeDateTime(record.entry.date),
    tags: record.entry.tags ?? [],
    cover,
  } satisfies PostContent;
}

export async function getCatalogItems(locale: Locale): Promise<CatalogListItem[]> {
  const entries = await readCatalogCollection();
  const items: CatalogListItem[] = [];

  for (const { entry, key } of entries) {
    if (!isPublished(entry)) {
      continue;
    }
    const mapped = mapCatalogListItem(entry, key, locale);
    if (!mapped) {
      continue;
    }
    items.push(mapped);
  }

  return items;
}

export async function getCatalogItemBySlug(slug: string, locale: Locale): Promise<CatalogItem | null> {
  const entries = await readCatalogCollection();
  const record = entries.find(({ entry }) => {
    const slugByLocale = mapLocalizedSlugs(entry.slug);
    return slugByLocale[locale] === slug;
  });
  if (!record) {
    return null;
  }
  if (!isPublished(record.entry)) {
    return null;
  }
  const baseItem = mapCatalogListItem(record.entry, record.key, locale);
  if (!baseItem) {
    return null;
  }
  const content = await resolveLocalizedContent(record.entry.content, locale);
  return { ...baseItem, content } satisfies CatalogItem;
}

export async function getAllCatalogEntries(): Promise<CatalogSummary[]> {
  const entries = await readCatalogCollection();
  return entries.map(({ entry, key }) => ({
    id: computeEntryId(entry, key),
    slugByLocale: mapLocalizedSlugs(entry.slug),
    published: isPublished(entry),
    updatedAt: normalizeDateTime(entry.updatedAt),
  } satisfies CatalogSummary));
}

export async function getPostAlternates(id: string): Promise<Partial<Record<Locale, string>>> {
  const entries = await readPostsCollection();
  const record = entries.find(({ entry, key }) => computeEntryId(entry, key) === id);
  if (!record) {
    return {};
  }
  return mapLocalizedSlugs(record.entry.slug);
}

export async function getPageAlternates(id: string): Promise<Partial<Record<Locale, string>>> {
  const entries = await readPagesCollection();
  const record = entries.find(({ entry, key }) => computeEntryId(entry, key) === id);
  if (!record) {
    return {};
  }
  return mapLocalizedSlugs(record.entry.slug);
}

export async function getCatalogAlternates(id: string): Promise<Partial<Record<Locale, string>>> {
  const entries = await readCatalogCollection();
  const record = entries.find(({ entry, key }) => computeEntryId(entry, key) === id);
  if (!record) {
    return {};
  }
  return mapLocalizedSlugs(record.entry.slug);
}

export async function getDocuments(): Promise<Document[]> {
  const entries = await readDocumentsCollection();
  const documents: Document[] = [];

  for (const { entry, key } of entries) {
    if (!isPublished(entry)) {
      continue;
    }
    const typeValue = typeof entry.type === 'string' ? (entry.type.trim() as DocumentType) : null;
    if (!typeValue || !DOCUMENT_TYPE_SET.has(typeValue)) {
      continue;
    }
    const langValue = typeof entry.lang === 'string' ? (entry.lang.trim() as DocumentLanguage) : null;
    if (!langValue || !DOCUMENT_LANGUAGE_SET.has(langValue)) {
      continue;
    }
    const filePath = normalizeFilePath(entry.file ?? null);
    const sanitizedFilePath = filePath ?? null;
    const fileName = sanitizedFilePath
      ? path.basename(sanitizedFilePath.split('?')[0]?.split('#')[0] ?? sanitizedFilePath)
      : null;
    const fileExtension = fileName && fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? null : null;
    const fileSize = await resolveUploadSize(sanitizedFilePath);
    const title = mapLocalizedTextRecord(entry.title);
    const relatedProductIds = mapRelationshipValues(entry.relatedProducts);
    documents.push({
      id: computeEntryId(entry, key),
      title,
      type: typeValue,
      lang: langValue,
      file: sanitizedFilePath,
      fileName,
      fileExtension,
      fileSize,
      relatedProductIds,
      updatedAt: normalizeDateTime(entry.updatedAt),
    });
  }

  documents.sort((a, b) => {
    const typeDiff = DOCUMENT_TYPE_ORDER.indexOf(a.type) - DOCUMENT_TYPE_ORDER.indexOf(b.type);
    if (typeDiff !== 0) {
      return typeDiff;
    }
    const updatedA = a.updatedAt ?? '';
    const updatedB = b.updatedAt ?? '';
    if (updatedA && updatedB && updatedA !== updatedB) {
      return updatedA > updatedB ? -1 : 1;
    }
    const titleA = pickFirstLocalizedText(a.title) ?? a.fileName ?? a.id;
    const titleB = pickFirstLocalizedText(b.title) ?? b.fileName ?? b.id;
    return titleA.localeCompare(titleB);
  });

  return documents;
}

export async function getDocumentsPage(): Promise<DocumentsPageContent | null> {
  const documentsPage = await readDocumentsPageSingleton();
  if (!documentsPage) {
    return null;
  }
  const title = mapLocalizedTextRecord(documentsPage.title);
  const description = mapLocalizedTextRecord(documentsPage.description);
  const ogImage = mapSeoImage(documentsPage.ogImage ?? null);

  if (!Object.keys(title).length && !Object.keys(description).length && !ogImage) {
    return null;
  }

  return { title, description, ogImage } satisfies DocumentsPageContent;
}

export async function getNavigationEntityByPath(
  locale: Locale,
  pathname: string
): Promise<{ link: NavigationLink; slugByLocale: Partial<Record<Locale, string>> } | null> {
  const navigation = await getNavigation(locale);
  const trimmed = pathname.replace(/^\/+/, '');
  const segments = trimmed.split('/').filter(Boolean);
  const relevantSegments = segments.length && isLocale(segments[0]) ? segments.slice(1) : segments;
  const relative = relevantSegments.join('/');
  const match = [...navigation.header, ...navigation.footer].find((link) => {
    if (!link.localizedPath) {
      return false;
    }
    const localized = link.localizedPath[locale]?.trim().replace(/^\/+|\/+$/g, '') ?? '';
    return localized === relative;
  });
  if (!match || !match.localizedPath) {
    return null;
  }
  return { link: match, slugByLocale: mapLocalizedSlugs(match.localizedPath) };
}

export {
  CATALOG_AUXILIARIES,
  CATALOG_BASES,
  CATALOG_CATEGORIES,
  CATALOG_FILLERS,
  CATALOG_PROCESSES,
} from './catalog/constants';
export type {
  CatalogAuxiliary,
  CatalogBase,
  CatalogCategory,
  CatalogFiller,
  CatalogProcess,
} from './catalog/constants';