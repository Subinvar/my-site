import { cache } from 'react';
import { createReader } from '@keystatic/core/reader';
import config from '../../../keystatic.config';
import { DEFAULT_LOCALE, FALLBACK_LOCALE, Locale } from '../i18n';

type Localized<T> = Partial<Record<Locale, T>>;

type SlugFieldValue = {
  slug?: string;
  name?: string;
};

type SeoEntry = {
  title?: string;
  description?: string;
};

type PageEntry = {
  slugKey: string;
  title?: Localized<string>;
  slug?: Localized<SlugFieldValue | string>;
  excerpt?: Localized<string>;
  seo?: Localized<SeoEntry>;
  content?: Localized<{ node: unknown }>;
};

type PostEntry = PageEntry & {
  publishedAt?: string | null;
};

type NavigationEntry = {
  label?: Localized<string>;
  slug?: Localized<SlugFieldValue | string>;
};

type SiteEntry = {
  seo?: Localized<SeoEntry>;
  contacts?: {
    ru?: { address?: string; phone?: string };
    en?: { address?: string; phone?: string };
    email?: string;
  };
};

type NavigationSingleton = {
  header?: NavigationEntry[];
  footer?: NavigationEntry[];
};

const getReader = cache(() => createReader(process.cwd(), config));

function toSlugString(value: SlugFieldValue | string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    return value;
  }
  return value.slug;
}

function normalizeSlug(slug: SlugFieldValue | string | undefined | null): string {
  const value = toSlugString(slug);
  if (!value) return '';
  return value.replace(/^\/+/, '').replace(/\/+$/, '');
}

function pickLocalized<T>(value: Localized<T> | undefined, locale: Locale): T | undefined {
  if (!value) return undefined;
  return value[locale] ?? value[FALLBACK_LOCALE];
}

function mapLocalizedSlugRecord(slugs: Localized<SlugFieldValue | string> | undefined): Partial<Record<Locale, string>> {
  const record: Partial<Record<Locale, string>> = {};
  if (!slugs) {
    return record;
  }
  for (const locale of Object.keys(slugs) as Locale[]) {
    const slug = normalizeSlug(slugs[locale] ?? undefined);
    record[locale] = slug;
  }
  return record;
}

export async function getSite(locale: Locale) {
  const reader = getReader();
  const site = (await reader.singletons.site.read({ resolveLinkedFiles: true })) as SiteEntry | null;
  const seo = pickLocalized(site?.seo, locale);
  const contactsByLocale = (site?.contacts ?? {}) as Partial<Record<Locale, { address?: string; phone?: string }>> & {
    email?: string;
  };
  const contacts = contactsByLocale[locale] ?? contactsByLocale[FALLBACK_LOCALE];

  return {
    seo,
    contacts,
    email: contactsByLocale.email,
  };
}

export async function getNavigation(locale: Locale) {
  const reader = getReader();
  const nav = (await reader.singletons.navigation.read({ resolveLinkedFiles: true })) as NavigationSingleton | null;

  const mapLinks = (entries: NavigationEntry[] | undefined) =>
    (entries ?? [])
      .map((entry) => {
        const localizedSlug = pickLocalized(entry.slug, locale);
        if (localizedSlug === undefined) {
          return null;
        }
        const slug = normalizeSlug(localizedSlug);
        const label = pickLocalized(entry.label, locale) ?? pickLocalized(entry.label, DEFAULT_LOCALE) ?? '';
        return {
          label,
          slug,
          localizedSlugs: mapLocalizedSlugRecord(entry.slug),
        };
      })
      .filter((entry): entry is { label: string; slug: string; localizedSlugs: Localized<string> } => entry !== null);

  return {
    header: mapLinks(nav?.header),
    footer: mapLinks(nav?.footer),
  };
}

async function getPagesEntries() {
  const reader = getReader();
  const entries = await reader.collections.pages.all({ resolveLinkedFiles: true });
  return entries.map(({ entry }) => ({ entry: entry as unknown as PageEntry }));
}

async function getPostsEntries() {
  const reader = getReader();
  const entries = await reader.collections.posts.all({ resolveLinkedFiles: true });
  return entries.map(({ entry }) => ({ entry: entry as unknown as PostEntry }));
}

function findEntryBySlug<T extends PageEntry | PostEntry>(entries: { entry: T }[], locale: Locale, target: string) {
  const normalizedTarget = normalizeSlug(target);
  return entries.find(({ entry }) => {
    const localizedSlug = normalizeSlug(pickLocalized(entry.slug, locale));
    if (localizedSlug === normalizedTarget) {
      return true;
    }
    if (!localizedSlug) {
      const fallbackSlug = normalizeSlug(pickLocalized(entry.slug, FALLBACK_LOCALE));
      return fallbackSlug === normalizedTarget;
    }
    return false;
  });
}

export async function getHomePage(locale: Locale) {
  const entries = await getPagesEntries();
  const match = entries.find(({ entry }) => normalizeSlug(pickLocalized(entry.slug, locale)) === '');
  if (!match) {
    return null;
  }
  return buildPagePayload(locale, match.entry);
}

function buildPagePayload(locale: Locale, entry: PageEntry) {
  const title = pickLocalized(entry.title, locale) ?? pickLocalized(entry.title, FALLBACK_LOCALE) ?? '';
  const content = pickLocalized(entry.content, locale) ?? pickLocalized(entry.content, FALLBACK_LOCALE);
  const excerpt = pickLocalized(entry.excerpt, locale) ?? pickLocalized(entry.excerpt, FALLBACK_LOCALE);
  const seo = pickLocalized(entry.seo, locale) ?? pickLocalized(entry.seo, FALLBACK_LOCALE);
  const slugRecord = mapLocalizedSlugRecord(entry.slug);
  const slug = slugRecord[locale] ?? slugRecord[FALLBACK_LOCALE] ?? '';
  return {
    slugKey: entry.slugKey,
    title,
    content,
    excerpt,
    seo,
    slug,
    localizedSlugs: slugRecord,
  };
}

export async function getPageBySlug(locale: Locale, slug: string) {
  const entries = await getPagesEntries();
  const match = findEntryBySlug(entries, locale, slug);
  if (!match) {
    return null;
  }
  return buildPagePayload(locale, match.entry);
}

export async function getAllPageSlugs(locale: Locale) {
  const entries = await getPagesEntries();
  return entries
    .map(({ entry }) => {
      const slugRecord = mapLocalizedSlugRecord(entry.slug);
      return slugRecord[locale] ?? slugRecord[FALLBACK_LOCALE] ?? '';
    })
    .filter((slug, index, self) => self.indexOf(slug) === index);
}

function buildPostPayload(locale: Locale, entry: PostEntry) {
  const base = buildPagePayload(locale, entry);
  return {
    ...base,
    publishedAt: entry.publishedAt ?? null,
  };
}

export async function getPostBySlug(locale: Locale, slug: string) {
  const entries = await getPostsEntries();
  const match = findEntryBySlug(entries, locale, slug);
  if (!match) {
    return null;
  }
  return buildPostPayload(locale, match.entry);
}

export async function getAllPostSlugs(locale: Locale) {
  const entries = await getPostsEntries();
  return entries
    .map(({ entry }) => {
      const slugRecord = mapLocalizedSlugRecord(entry.slug);
      return slugRecord[locale] ?? slugRecord[FALLBACK_LOCALE] ?? '';
    })
    .filter((slug, index, self) => slug && self.indexOf(slug) === index);
}
