import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { createReader } from '@keystatic/core/reader';
import config from '../../keystatic.config';
import { defaultLocale, locales, type Locale } from './i18n';

const ROOT_SLUG_PLACEHOLDER = '__root__';

const getReader = cache(() => createReader(process.cwd(), config));

type Localized<T> = Partial<Record<Locale, T | null | undefined>>;

type RawMedia = string | { src?: string | null } | null | undefined;

type RawSeo = {
  title?: string | null;
  description?: string | null;
  ogImage?: { image?: RawMedia; alt?: string | null } | null;
} | null;

type RawPageEntry = {
  id?: string | null;
  slug?: Localized<string | { slug?: string | null } | null>;
  title?: Localized<string>;
  content?: Localized<string | { content?: string | null } | null>;
  seo?: Localized<RawSeo>;
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

type NavigationEntry = {
  id?: string | null;
  label?: Localized<string>;
  path?: Localized<string>;
  externalUrl?: string | null;
  newTab?: boolean | null;
  order?: number | null;
};

export type Seo = {
  title?: string | null;
  description?: string | null;
  ogImage?: { src: string; alt?: string | null } | null;
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
  defaultSeo: Seo | null;
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
  content: string | null;
  seo: Seo | null;
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

function toOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeMedia(value: RawMedia): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  const src = value.src;
  if (typeof src !== 'string') {
    return null;
  }
  return src;
}

function mapSeo(value: RawSeo | undefined | null): Seo | null {
  if (!value) {
    return null;
  }
  const title = toOptionalString(value.title ?? undefined);
  const description = toOptionalString(value.description ?? undefined);
  const imageSrc = normalizeMedia(value.ogImage?.image);
  const ogImage = imageSrc ? { src: imageSrc, alt: toOptionalString(value.ogImage?.alt ?? undefined) } : null;
  if (!title && !description && !ogImage) {
    return null;
  }
  return { title, description, ogImage };
}

function isPublished(entry: RawPageEntry | RawPostEntry): boolean {
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

async function readMarkdoc(reference: string | { content?: string | null } | null | undefined): Promise<string | null> {
  if (!reference) {
    return null;
  }
  if (typeof reference === 'object' && reference !== null && typeof reference.content === 'string') {
    return reference.content;
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

async function resolveLocalizedContent(content: Localized<string | { content?: string | null } | null> | undefined, locale: Locale): Promise<string | null> {
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
  defaultSeo?: Localized<RawSeo>;
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
  return ((await reader.singletons.site.read()) ?? null) as SiteSingleton | null;
});

const readNavigationSingleton = cache(async (): Promise<NavigationSingleton | null> => {
  const reader = getReader();
  return ((await reader.singletons.navigation.read()) ?? null) as NavigationSingleton | null;
});

const readPagesCollection = cache(async () => {
  const reader = getReader();
  const entries = await reader.collections.pages.all({ resolveLinkedFiles: true });
  return entries.map(({ slug, entry }) => ({ key: slug, entry: entry as RawPageEntry }));
});

const readPostsCollection = cache(async () => {
  const reader = getReader();
  const entries = await reader.collections.posts.all({ resolveLinkedFiles: true });
  return entries.map(({ slug, entry }) => ({ key: slug, entry: entry as RawPostEntry }));
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
  const trimmed = pathValue.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${locale}/${trimmed}` : `/${locale}`;
}

function computeEntryId(entry: RawPageEntry | RawPostEntry, fallback: string): string {
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
  const defaultSeo = mapSeo(pickLocalized(site?.defaultSeo, locale));
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
    defaultSeo,
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
  const seo = mapSeo(pickLocalized(entryRecord.entry.seo, locale));
  const excerpt = pickLocalized(entryRecord.entry.excerpt, locale) ?? null;
  return {
    id,
    locale,
    title,
    slug,
    slugByLocale,
    content,
    seo,
    excerpt,
    updatedAt: entryRecord.entry.updatedAt ?? null,
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
      updatedAt: entry.updatedAt ?? null,
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
  const seo = mapSeo(pickLocalized(record.entry.seo, locale));
  const excerpt = pickLocalized(record.entry.excerpt, locale) ?? null;
  return {
    id: computeEntryId(record.entry, record.key),
    locale,
    title,
    slug,
    slugByLocale,
    content,
    seo,
    excerpt,
    updatedAt: record.entry.updatedAt ?? null,
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
      date: entry.date ?? null,
      updatedAt: entry.updatedAt ?? null,
    } satisfies PostSummary;
  });
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
  const seo = mapSeo(pickLocalized(record.entry.seo, locale));
  const excerpt = pickLocalized(record.entry.excerpt, locale) ?? null;
  const coverSrc = normalizeMedia(record.entry.cover?.image);
  const cover = coverSrc
    ? { src: coverSrc, alt: pickLocalized(record.entry.cover?.alt, locale) ?? null }
    : null;
  return {
    id: computeEntryId(record.entry, record.key),
    locale,
    title,
    slug,
    slugByLocale,
    content,
    seo,
    excerpt,
    updatedAt: record.entry.updatedAt ?? null,
    date: record.entry.date ?? null,
    tags: record.entry.tags ?? [],
    cover,
  } satisfies PostContent;
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

export async function getNavigationEntityByPath(
  locale: Locale,
  pathname: string
): Promise<{ link: NavigationLink; slugByLocale: Partial<Record<Locale, string>> } | null> {
  const navigation = await getNavigation(locale);
  const relative = pathname.replace(/^\/+/, '').split('/').slice(1).join('/');
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