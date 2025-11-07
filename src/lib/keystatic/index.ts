import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { createReader } from '@keystatic/core/reader';
import config from '../../../keystatic.config';
import { DEFAULT_LOCALE, FALLBACK_LOCALE, Locale } from '../i18n';

const ROOT_SLUG_PLACEHOLDER = '__root__';

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

type DictionaryEntry = {
  brandName?: Localized<string>;
  header?: {
    navigationAriaLabel?: Localized<string>;
    homeAriaLabel?: Localized<string>;
  };
  footer?: {
    navigationTitle?: Localized<string>;
    contactsTitle?: Localized<string>;
    copyright?: Localized<string>;
  };
  buttons?: {
    goHome?: Localized<string>;
    retry?: Localized<string>;
  };
  states?: {
    loading?: Localized<string>;
    emptyPosts?: Localized<string>;
    emptyPages?: Localized<string>;
    nothingFound?: Localized<string>;
  };
  pagination?: {
    previous?: Localized<string>;
    next?: Localized<string>;
  };
  breadcrumbs?: {
    ariaLabel?: Localized<string>;
    rootLabel?: Localized<string>;
  };
  languageSwitcher?: {
    ariaLabel?: Localized<string>;
    availableLabel?: Localized<string>;
  };
  errors?: {
    notFoundTitle?: Localized<string>;
    notFoundDescription?: Localized<string>;
    errorTitle?: Localized<string>;
    errorDescription?: Localized<string>;
  };
  seo?: {
    ogImageAlt?: Localized<string>;
  };
  markdoc?: {
    calloutTitle?: Localized<string>;
    noteLabel?: Localized<string>;
    warningLabel?: Localized<string>;
    infoLabel?: Localized<string>;
  };
};

export type UiDictionary = {
  brandName: string;
  header: {
    navigationAriaLabel: string;
    homeAriaLabel: string;
  };
  footer: {
    navigationTitle: string;
    contactsTitle: string;
    copyright: string;
  };
  buttons: {
    goHome: string;
    retry: string;
  };
  states: {
    loading: string;
    emptyPosts: string;
    emptyPages: string;
    nothingFound: string;
  };
  pagination: {
    previous: string;
    next: string;
  };
  breadcrumbs: {
    ariaLabel: string;
    rootLabel: string;
  };
  languageSwitcher: {
    ariaLabel: string;
    availableLabel: string;
  };
  errors: {
    notFoundTitle: string;
    notFoundDescription: string;
    errorTitle: string;
    errorDescription: string;
  };
  seo: {
    ogImageAlt: string;
  };
  markdoc: {
    calloutTitle: string;
    noteLabel: string;
    warningLabel: string;
    infoLabel: string;
  };
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
  if (!value || value === ROOT_SLUG_PLACEHOLDER) return '';
  return value.replace(/^\/+/, '').replace(/\/+$/, '');
}

function pickLocalized<T>(value: Localized<T> | undefined, locale: Locale, options?: { fallback?: boolean }): T | undefined {
  if (!value) return undefined;
  if (value[locale] !== undefined) {
    return value[locale];
  }
  if (options?.fallback === false) {
    return undefined;
  }
  return value[FALLBACK_LOCALE];
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
        const localizedSlug = pickLocalized(entry.slug, locale, { fallback: false });
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

export const getDictionary = cache(async (locale: Locale): Promise<UiDictionary> => {
  const reader = getReader();
  const dictionary = (await reader.singletons.dictionary.read({ resolveLinkedFiles: true })) as DictionaryEntry | null;

  const resolve = (value: Localized<string> | undefined, fallback = '') => pickLocalized(value, locale) ?? fallback;

  return {
    brandName: resolve(dictionary?.brandName),
    header: {
      navigationAriaLabel: resolve(dictionary?.header?.navigationAriaLabel),
      homeAriaLabel: resolve(dictionary?.header?.homeAriaLabel),
    },
    footer: {
      navigationTitle: resolve(dictionary?.footer?.navigationTitle),
      contactsTitle: resolve(dictionary?.footer?.contactsTitle),
      copyright: resolve(dictionary?.footer?.copyright),
    },
    buttons: {
      goHome: resolve(dictionary?.buttons?.goHome),
      retry: resolve(dictionary?.buttons?.retry),
    },
    states: {
      loading: resolve(dictionary?.states?.loading),
      emptyPosts: resolve(dictionary?.states?.emptyPosts),
      emptyPages: resolve(dictionary?.states?.emptyPages),
      nothingFound: resolve(dictionary?.states?.nothingFound),
    },
    pagination: {
      previous: resolve(dictionary?.pagination?.previous),
      next: resolve(dictionary?.pagination?.next),
    },
    breadcrumbs: {
      ariaLabel: resolve(dictionary?.breadcrumbs?.ariaLabel),
      rootLabel: resolve(dictionary?.breadcrumbs?.rootLabel),
    },
    languageSwitcher: {
      ariaLabel: resolve(dictionary?.languageSwitcher?.ariaLabel),
      availableLabel: resolve(dictionary?.languageSwitcher?.availableLabel),
    },
    errors: {
      notFoundTitle: resolve(dictionary?.errors?.notFoundTitle),
      notFoundDescription: resolve(dictionary?.errors?.notFoundDescription),
      errorTitle: resolve(dictionary?.errors?.errorTitle),
      errorDescription: resolve(dictionary?.errors?.errorDescription),
    },
    seo: {
      ogImageAlt: resolve(dictionary?.seo?.ogImageAlt),
    },
    markdoc: {
      calloutTitle: resolve(dictionary?.markdoc?.calloutTitle),
      noteLabel: resolve(dictionary?.markdoc?.noteLabel),
      warningLabel: resolve(dictionary?.markdoc?.warningLabel),
      infoLabel: resolve(dictionary?.markdoc?.infoLabel),
    },
  };
});

type PageEntryRecord = { entry: PageEntry; slugKey: string };

async function getPagesEntries(): Promise<PageEntryRecord[]> {
  const reader = getReader();
  const entries = await reader.collections.pages.all({ resolveLinkedFiles: true });
  return entries.map(({ entry }) => {
    const typedEntry = entry as unknown as PageEntry;
    return {
      entry: typedEntry,
      slugKey: typedEntry.slugKey,
    };
  });
}

type PostEntryRecord = { entry: PostEntry; slugKey: string };

export type PagePayload = {
  slugKey: string;
  title: string;
  content?: { node: unknown };
  excerpt?: string;
  seo?: SeoEntry;
  slug: string;
  localizedSlugs: Partial<Record<Locale, string>>;
};

export type PostPayload = PagePayload & {
  publishedAt: string | null;
  updatedAt: string | null;
};

async function getPostsEntries(): Promise<PostEntryRecord[]> {
  const reader = getReader();
  const entries = await reader.collections.posts.all({ resolveLinkedFiles: true });
  return entries.map(({ entry }) => {
    const typedEntry = entry as unknown as PostEntry;
    return {
      entry: typedEntry,
      slugKey: typedEntry.slugKey,
    };
  });
}

function findEntryBySlug<T extends PageEntry | PostEntry>(
  entries: { entry: T; slugKey: string }[],
  locale: Locale,
  target: string,
) {
  const normalizedTarget = normalizeSlug(target);
  return entries.find(({ entry }) => {
    const localizedSlug = pickLocalized(entry.slug, locale, { fallback: false });
    if (localizedSlug === undefined) {
      return false;
    }
    return normalizeSlug(localizedSlug) === normalizedTarget;
  });
}

export async function getHomePage(locale: Locale): Promise<PagePayload | null> {
  const entries = await getPagesEntries();
  const match = entries.find(({ entry }) => normalizeSlug(pickLocalized(entry.slug, locale, { fallback: false })) === '');
  if (!match) {
    return null;
  }
  return buildPagePayload(locale, match.entry);
}

function buildPagePayload(locale: Locale, entry: PageEntry): PagePayload {
  const title = pickLocalized(entry.title, locale) ?? pickLocalized(entry.title, FALLBACK_LOCALE) ?? '';
  const content = pickLocalized(entry.content, locale) ?? pickLocalized(entry.content, FALLBACK_LOCALE);
  const excerpt = pickLocalized(entry.excerpt, locale) ?? pickLocalized(entry.excerpt, FALLBACK_LOCALE);
  const seo = pickLocalized(entry.seo, locale) ?? pickLocalized(entry.seo, FALLBACK_LOCALE);
  const slugRecord = mapLocalizedSlugRecord(entry.slug);
  const slug = slugRecord[locale] ?? '';
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

async function getContentFileStat(collection: 'pages' | 'posts', slugKey: string): Promise<Date | undefined> {
  if (!slugKey) {
    return undefined;
  }
  const filePath = path.join(process.cwd(), 'src/content', collection, `${slugKey}.json`);
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  } catch {
    return undefined;
  }
}

function toValidDate(value?: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

function mergeLatestDate(...dates: (Date | undefined)[]): Date | undefined {
  const validDates = dates.filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()));
  if (validDates.length === 0) {
    return undefined;
  }
  return new Date(Math.max(...validDates.map((date) => date.getTime())));
}

export async function getPageBySlug(locale: Locale, slug: string): Promise<PagePayload | null> {
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
      return slugRecord[locale] ?? '';
    })
    .filter((slug): slug is string => Boolean(slug))
    .filter((slug, index, self) => self.indexOf(slug) === index);
}

function buildPostPayload(locale: Locale, entry: PostEntry): PostPayload {
  const base = buildPagePayload(locale, entry);
  return {
    ...base,
    publishedAt: entry.publishedAt ?? null,
    updatedAt: null,
  };
}

export async function getPostBySlug(locale: Locale, slug: string): Promise<PostPayload | null> {
  const entries = await getPostsEntries();
  const match = findEntryBySlug(entries, locale, slug);
  if (!match) {
    return null;
  }
  const payload = buildPostPayload(locale, match.entry);
  const fileDate = await getContentFileStat('posts', match.slugKey);
  const publishedAtDate = toValidDate(match.entry.publishedAt ?? undefined);
  const latest = mergeLatestDate(fileDate, publishedAtDate);
  return {
    ...payload,
    publishedAt: payload.publishedAt,
    updatedAt: latest?.toISOString() ?? null,
  };
}

export async function getAllPostSlugs(locale: Locale) {
  const entries = await getPostsEntries();
  return entries
    .map(({ entry }) => {
      const slugRecord = mapLocalizedSlugRecord(entry.slug);
      return slugRecord[locale] ?? '';
    })
    .filter((slug): slug is string => Boolean(slug))
    .filter((slug, index, self) => self.indexOf(slug) === index);
}

export async function getAllPosts(locale: Locale): Promise<PostPayload[]> {
  const entries = await getPostsEntries();
  const posts = await Promise.all(
    entries.map(async ({ entry, slugKey }) => {
      const payload = buildPostPayload(locale, entry);
      const fileDate = await getContentFileStat('posts', slugKey);
      const publishedAtDate = toValidDate(entry.publishedAt ?? undefined);
      const latest = mergeLatestDate(fileDate, publishedAtDate);
      return {
        ...payload,
        publishedAt: payload.publishedAt,
        updatedAt: latest?.toISOString() ?? null,
      } satisfies PostPayload;
    })
  );

  return posts.filter((post) => Boolean(post.slug));
}

export type SitemapContentEntry = {
  collection: 'pages' | 'posts';
  localizedSlugs: Partial<Record<Locale, string>>;
  lastModified?: string;
};

export async function getSitemapContentEntries(): Promise<SitemapContentEntry[]> {
  const [pageEntries, postEntries] = await Promise.all([getPagesEntries(), getPostsEntries()]);

  const pages = await Promise.all(
    pageEntries.map(async ({ entry, slugKey }) => {
      const slugRecord = mapLocalizedSlugRecord(entry.slug);
      const fileDate = await getContentFileStat('pages', slugKey);
      return {
        collection: 'pages' as const,
        localizedSlugs: slugRecord,
        lastModified: fileDate?.toISOString(),
      } satisfies SitemapContentEntry;
    })
  );

  const posts = await Promise.all(
    postEntries.map(async ({ entry, slugKey }) => {
      const slugRecord = mapLocalizedSlugRecord(entry.slug);
      const fileDate = await getContentFileStat('posts', slugKey);
      const publishedAtDate = toValidDate(entry.publishedAt ?? undefined);
      const latest = mergeLatestDate(fileDate, publishedAtDate);
      return {
        collection: 'posts' as const,
        localizedSlugs: slugRecord,
        lastModified: latest?.toISOString(),
      } satisfies SitemapContentEntry;
    })
  );

  return [...pages, ...posts];
}
