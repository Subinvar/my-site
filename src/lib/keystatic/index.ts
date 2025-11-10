import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { createReader } from '@keystatic/core/reader';
import config from '../../../keystatic.config';
import { fallbackLocale, locales, type Locale } from '../i18n';

const ROOT_SLUG_PLACEHOLDER = '__root__';

type Localized<T> = Partial<Record<Locale, T>>;

type SlugFieldValue = {
  slug?: string;
  name?: string;
};

type MediaFieldValue = string | { src?: string | null } | null | undefined;

type SeoImage = {
  src: string;
  alt?: string;
};

type SeoEntry = {
  title?: string;
  description?: string;
  ogImage?: SeoImage;
};

type TwitterCardType = 'summary' | 'summary_large_image' | 'player' | 'app';

type TwitterMeta = {
  card?: TwitterCardType;
  site?: string;
  creator?: string;
} | null;

const TWITTER_CARDS: readonly TwitterCardType[] = ['summary', 'summary_large_image', 'player', 'app'];

type NavigationEntry = {
  id?: string;
  label?: Localized<string>;
  path?: Localized<string>;
  newTab?: boolean | null;
  order?: number | null;
};

type NavigationSingleton = {
  headerLinks?: NavigationEntry[];
  footerLinks?: NavigationEntry[];
} | null;

type DictionaryEntry = {
  common?: {
    siteName?: Localized<string>;
    tagline?: Localized<string>;
    buttons?: {
      goHome?: Localized<string>;
      retry?: Localized<string>;
      readMore?: Localized<string>;
      goBack?: Localized<string>;
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
    labels?: {
      author?: Localized<string>;
      search?: Localized<string>;
      searchPlaceholder?: Localized<string>;
    };
  };
  header?: {
    navigationAriaLabel?: Localized<string>;
    homeAriaLabel?: Localized<string>;
  };
  footer?: {
    navigationTitle?: Localized<string>;
    contactsTitle?: Localized<string>;
    copyright?: Localized<string>;
  };
  forms?: {
    nameLabel?: Localized<string>;
    emailLabel?: Localized<string>;
    messageLabel?: Localized<string>;
    submitLabel?: Localized<string>;
  };
  seo?: {
    ogImageAlt?: Localized<string>;
    shareTitle?: Localized<string>;
  };
  messages?: {
    loading?: Localized<string>;
    emptyPosts?: Localized<string>;
    emptyPages?: Localized<string>;
    nothingFound?: Localized<string>;
    errors?: {
      notFoundTitle?: Localized<string>;
      notFoundDescription?: Localized<string>;
      errorTitle?: Localized<string>;
      errorDescription?: Localized<string>;
    };
    markdoc?: {
      calloutTitle?: Localized<string>;
      noteLabel?: Localized<string>;
      warningLabel?: Localized<string>;
      infoLabel?: Localized<string>;
    };
  };
} | null;

type SiteEntry = {
  brand?: {
    logo?: {
      image?: MediaFieldValue;
      alt?: Localized<string>;
    };
    companyName?: string;
    siteName?: Localized<string>;
    tagline?: Localized<string>;
    contacts?: {
      phone?: string;
      email?: string;
      address?: Localized<string>;
    };
    socials?: {
      label?: string;
      url?: string;
      newTab?: boolean | null;
    }[];
  };
  defaultSeo?: Localized<{
    title?: string;
    description?: string;
    ogImage?: {
      image?: MediaFieldValue;
      alt?: string;
    } | null;
  }>;
  twitter?: {
    card?: string;
    site?: string;
    creator?: string;
  } | null;
  meta?: {
    domain?: string;
    robots?: {
      index?: boolean | null;
      follow?: boolean | null;
    };
    organization?: {
      legalName?: string;
      taxId?: string;
    };
  };
} | null;

type PageEntry = {
  id?: string;
  slugKey: string;
  status?: 'draft' | 'published';
  datePublished?: string | null;
  updatedAt?: string | null;
  title?: Localized<string>;
  slug?: Localized<SlugFieldValue | string>;
  excerpt?: Localized<string>;
  cover?: {
    image?: MediaFieldValue;
    alt?: Localized<string>;
  } | null;
  content?: Localized<string>;
  seo?: Localized<{
    title?: string;
    description?: string;
    ogImage?: {
      image?: MediaFieldValue;
      alt?: string;
    } | null;
  }>;
};

type PostEntry = PageEntry & {
  tags?: string[] | null;
  author?: string | null;
  readingTime?: number | null;
  canonicalUrl?: Localized<string>;
};

type PageEntryRecord = { entry: PageEntry; slugKey: string };
type PostEntryRecord = { entry: PostEntry; slugKey: string };

type NavigationLinkInternal = {
  kind: 'internal';
  label: string;
  slug: string;
  slugByLocale: Partial<Record<Locale, string>>;
  order: number;
};

type NavigationLinkExternal = {
  kind: 'external';
  label: string;
  url: string;
  newTab: boolean;
  order: number;
};

export type NavigationLink = NavigationLinkInternal | NavigationLinkExternal;

export type NavigationResult = {
  header: NavigationLink[];
  footer: NavigationLink[];
};

export type UiDictionary = {
  common: {
    siteName: string;
    tagline: string;
    buttons: {
      goHome: string;
      retry: string;
      readMore: string;
      goBack: string;
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
    labels: {
      author: string;
      search: string;
      searchPlaceholder: string;
    };
  };
  header: {
    navigationAriaLabel: string;
    homeAriaLabel: string;
  };
  footer: {
    navigationTitle: string;
    contactsTitle: string;
    copyright: string;
  };
  forms: {
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    submitLabel: string;
  };
  seo: {
    ogImageAlt: string;
    shareTitle: string;
  };
  messages: {
    loading: string;
    emptyPosts: string;
    emptyPages: string;
    nothingFound: string;
    errors: {
      notFoundTitle: string;
      notFoundDescription: string;
      errorTitle: string;
      errorDescription: string;
    };
    markdoc: {
      calloutTitle: string;
      noteLabel: string;
      warningLabel: string;
      infoLabel: string;
    };
  };
};

type SiteBrand = {
  companyName: string;
  siteName: string;
  tagline?: string;
  logo?: SeoImage;
  contacts: {
    phone?: string;
    email?: string;
    address?: string;
  };
  socials: {
    label: string;
    url: string;
    newTab: boolean;
  }[];
};

export type SiteData = {
  brand: SiteBrand;
  defaultSeo?: SeoEntry;
  seo?: SeoEntry;
  twitter?: TwitterMeta;
  meta?: {
    domain?: string;
    robots?: {
      index?: boolean;
      follow?: boolean;
    };
    organization?: {
      legalName?: string;
      taxId?: string;
    };
  };
};

export type PagePayload = {
  id: string;
  slugKey: string;
  status: 'draft' | 'published';
  title: string;
  slug: string;
  slugByLocale: Partial<Record<Locale, string>>;
  excerpt?: string;
  content?: string | null;
  seo?: SeoEntry;
  cover?: SeoImage;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type PostPayload = PagePayload & {
  tags: string[];
  author?: string | null;
  readingTime?: number | null;
  canonicalUrl?: string;
};

export type SitemapContentEntry = {
  collection: 'pages' | 'posts';
  slugByLocale: Partial<Record<Locale, string>>;
  lastModified?: string;
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

type PickLocalizedOptions<T> = {
  fallback?: boolean;
  allowEmptyFallback?: boolean;
  isMeaningful?: (candidate: T | undefined) => boolean;
};

function hasLocalizedContent(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(record, 'slug')) {
      const slugValue = record.slug;
      if (typeof slugValue === 'string') {
        return slugValue.trim().length > 0;
      }
      return slugValue !== null && slugValue !== undefined;
    }

    return Object.values(record).some((nested) => hasLocalizedContent(nested));
  }

  return true;
}

function pickLocalized<T>(
  value: Localized<T> | undefined | null,
  locale: Locale,
  options?: PickLocalizedOptions<T>
): T | undefined {
  if (!value) {
    return undefined;
  }

  const isMeaningful = options?.isMeaningful ?? ((candidate?: T) => hasLocalizedContent(candidate));
  const localized = value[locale];

  if (locale === fallbackLocale) {
    return localized ?? undefined;
  }

  if (localized !== undefined && isMeaningful(localized)) {
    return localized;
  }

  if (options?.fallback === false) {
    return undefined;
  }

  const fallbackValue = value[fallbackLocale];

  if (fallbackValue === undefined) {
    return undefined;
  }

  if (options?.allowEmptyFallback) {
    return fallbackValue;
  }

  return isMeaningful(fallbackValue) ? fallbackValue : undefined;
}

function mapLocalizedSlugRecord(slugs: Localized<SlugFieldValue | string> | undefined | null): Partial<Record<Locale, string>> {
  const record: Partial<Record<Locale, string>> = {};
  if (!slugs) {
    return record;
  }

  for (const locale of locales) {
    const localizedSlug = pickLocalized(slugs, locale, { allowEmptyFallback: true });
    if (localizedSlug === undefined) {
      continue;
    }
    record[locale] = normalizeSlug(localizedSlug);
  }

  return record;
}

type ContentReference = {
  relative: string;
  absolute: string;
};

function normalizeContentReference(value: string | undefined | null): ContentReference | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const relative = trimmed.startsWith('content/') ? trimmed : `content/${trimmed.replace(/^\/+/, '')}`;
  const absolute = path.join(process.cwd(), relative);
  return { relative, absolute } satisfies ContentReference;
}

function collectContentReferences(content: Localized<string> | undefined | null): ContentReference[] {
  if (!content) {
    return [];
  }
  const entries = new Map<string, ContentReference>();
  for (const locale of Object.keys(content) as Locale[]) {
    const reference = normalizeContentReference(content[locale]);
    if (reference && !entries.has(reference.absolute)) {
      entries.set(reference.absolute, reference);
    }
  }
  return Array.from(entries.values());
}

async function readMarkdocFile(reference: ContentReference | undefined): Promise<string | undefined> {
  if (!reference) {
    return undefined;
  }
  try {
    return await fs.readFile(reference.absolute, 'utf8');
  } catch {
    return undefined;
  }
}

async function resolveLocalizedMarkdoc(
  content: Localized<string> | undefined,
  locale: Locale
): Promise<{ value: string | null; reference?: ContentReference }> {
  const exactReference = normalizeContentReference(pickLocalized(content, locale, { fallback: false }));
  const fallbackReference = exactReference ? undefined : normalizeContentReference(pickLocalized(content, fallbackLocale));
  const reference = exactReference ?? fallbackReference;
  const value = await readMarkdocFile(reference);
  return { value: value ?? null, reference };
}

function normalizeAssetPath(value: MediaFieldValue): string | undefined {
  if (!value) {
    return undefined;
  }
  const raw = typeof value === 'string' ? value : value?.src ?? undefined;
  if (!raw) {
    return undefined;
  }
  if (/^https?:\/\//.test(raw)) {
    return raw;
  }
  const normalized = raw.replace(/^public\//, '');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function mapSeo(value: { title?: string; description?: string; ogImage?: { image?: MediaFieldValue; alt?: string | null } | null } | undefined): SeoEntry | undefined {
  if (!value) {
    return undefined;
  }
  const ogSrc = normalizeAssetPath(value.ogImage?.image ?? null);
  const ogAlt = value.ogImage?.alt ?? undefined;
  return {
    title: value.title,
    description: value.description,
    ogImage: ogSrc ? { src: ogSrc, alt: ogAlt } : undefined,
  };
}

export async function getSite(locale: Locale): Promise<SiteData> {
  const reader = getReader();
  const site = (await reader.singletons.site.read({ resolveLinkedFiles: true })) as SiteEntry;

  const brandEntry = site?.brand ?? {};
  const brand: SiteBrand = {
    companyName: brandEntry.companyName ?? '',
    siteName: pickLocalized(brandEntry.siteName, locale) ?? brandEntry.companyName ?? '',
    tagline: pickLocalized(brandEntry.tagline, locale),
    logo: (() => {
      const src = normalizeAssetPath(brandEntry.logo?.image ?? null);
      if (!src) {
        return undefined;
      }
      const alt = pickLocalized(brandEntry.logo?.alt, locale);
      return { src, alt: alt ?? undefined } satisfies SeoImage;
    })(),
    contacts: {
      phone: brandEntry.contacts?.phone ?? undefined,
      email: brandEntry.contacts?.email ?? undefined,
      address: pickLocalized(brandEntry.contacts?.address, locale),
    },
    socials: (brandEntry.socials ?? [])
      .map((item) => {
        if (!item?.url || !item?.label) {
          return null;
        }
        return {
          label: item.label,
          url: item.url,
          newTab: Boolean(item.newTab ?? true),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };

  const seo = pickLocalized(site?.defaultSeo, locale) ?? undefined;
  const twitterSource = site?.twitter ?? null;
  const twitter = twitterSource
    ? {
        card: TWITTER_CARDS.includes(twitterSource.card as TwitterCardType)
          ? (twitterSource.card as TwitterCardType)
          : undefined,
        site: twitterSource.site ?? undefined,
        creator: twitterSource.creator ?? undefined,
      }
    : null;

  return {
    brand,
    defaultSeo: mapSeo(seo),
    seo: mapSeo(seo),
    twitter,
    meta: {
      domain: site?.meta?.domain,
      robots: {
        index: site?.meta?.robots?.index ?? undefined,
        follow: site?.meta?.robots?.follow ?? undefined,
      },
      organization: site?.meta?.organization,
    },
  };
}

function normalizeNavigationPath(value: string | undefined | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const normalized = trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
  return normalized;
}

function buildNavigationSlugRecord(entry: NavigationEntry): Partial<Record<Locale, string>> {
  const record: Partial<Record<Locale, string>> = {};
  for (const candidate of locales) {
    const path = pickLocalized(entry.path, candidate, { allowEmptyFallback: true });
    const normalized = normalizeNavigationPath(path ?? undefined);
    if (!normalized || /^https?:\/\//i.test(normalized)) {
      continue;
    }
    record[candidate] = normalized;
  }
  return record;
}

function mapNavigationEntry(locale: Locale, entry: NavigationEntry): NavigationLink | null {
  const label = pickLocalized(entry.label, locale);
  if (!label) {
    return null;
  }

  const order = entry.order ?? 0;
  const rawPath = pickLocalized(entry.path, locale);
  const normalized = normalizeNavigationPath(rawPath);

  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return {
      kind: 'external',
      label,
      url: normalized,
      newTab: Boolean(entry.newTab),
      order,
    } satisfies NavigationLinkExternal;
  }

  const slugByLocale = buildNavigationSlugRecord(entry);

  return {
    kind: 'internal',
    label,
    slug: normalized,
    slugByLocale,
    order,
  } satisfies NavigationLinkInternal;
}

function sortNavigationLinks(links: NavigationLink[]): NavigationLink[] {
  return [...links].sort((a, b) => a.order - b.order);
}

export async function getNavigation(locale: Locale): Promise<NavigationResult> {
  const reader = getReader();
  const nav = (await reader.singletons.navigation.read({ resolveLinkedFiles: true })) as NavigationSingleton;

  const build = (entries: NavigationEntry[] | undefined) =>
    sortNavigationLinks(
      (entries ?? [])
        .map((entry) => mapNavigationEntry(locale, entry))
        .filter((item): item is NavigationLink => item !== null)
    );

  return {
    header: build(nav?.headerLinks),
    footer: build(nav?.footerLinks),
  };
}

export const getDictionary = cache(async (locale: Locale): Promise<UiDictionary> => {
  const reader = getReader();
  const dictionary = (await reader.singletons.dictionary.read({ resolveLinkedFiles: true })) as DictionaryEntry;

  const resolve = (value: Localized<string> | undefined, fallback = '') => pickLocalized(value, locale) ?? fallback;

  return {
    common: {
      siteName: resolve(dictionary?.common?.siteName),
      tagline: resolve(dictionary?.common?.tagline),
      buttons: {
        goHome: resolve(dictionary?.common?.buttons?.goHome),
        retry: resolve(dictionary?.common?.buttons?.retry),
        readMore: resolve(dictionary?.common?.buttons?.readMore),
        goBack: resolve(dictionary?.common?.buttons?.goBack),
      },
      pagination: {
        previous: resolve(dictionary?.common?.pagination?.previous),
        next: resolve(dictionary?.common?.pagination?.next),
      },
      breadcrumbs: {
        ariaLabel: resolve(dictionary?.common?.breadcrumbs?.ariaLabel),
        rootLabel: resolve(dictionary?.common?.breadcrumbs?.rootLabel),
      },
      languageSwitcher: {
        ariaLabel: resolve(dictionary?.common?.languageSwitcher?.ariaLabel),
        availableLabel: resolve(dictionary?.common?.languageSwitcher?.availableLabel),
      },
      labels: {
        author: resolve(dictionary?.common?.labels?.author),
        search: resolve(dictionary?.common?.labels?.search),
        searchPlaceholder: resolve(dictionary?.common?.labels?.searchPlaceholder),
      },
    },
    header: {
      navigationAriaLabel: resolve(dictionary?.header?.navigationAriaLabel),
      homeAriaLabel: resolve(dictionary?.header?.homeAriaLabel),
    },
    footer: {
      navigationTitle: resolve(dictionary?.footer?.navigationTitle),
      contactsTitle: resolve(dictionary?.footer?.contactsTitle),
      copyright: resolve(dictionary?.footer?.copyright),
    },
    forms: {
      nameLabel: resolve(dictionary?.forms?.nameLabel),
      emailLabel: resolve(dictionary?.forms?.emailLabel),
      messageLabel: resolve(dictionary?.forms?.messageLabel),
      submitLabel: resolve(dictionary?.forms?.submitLabel),
    },
    seo: {
      ogImageAlt: resolve(dictionary?.seo?.ogImageAlt),
      shareTitle: resolve(dictionary?.seo?.shareTitle),
    },
    messages: {
      loading: resolve(dictionary?.messages?.loading),
      emptyPosts: resolve(dictionary?.messages?.emptyPosts),
      emptyPages: resolve(dictionary?.messages?.emptyPages),
      nothingFound: resolve(dictionary?.messages?.nothingFound),
      errors: {
        notFoundTitle: resolve(dictionary?.messages?.errors?.notFoundTitle),
        notFoundDescription: resolve(dictionary?.messages?.errors?.notFoundDescription),
        errorTitle: resolve(dictionary?.messages?.errors?.errorTitle),
        errorDescription: resolve(dictionary?.messages?.errors?.errorDescription),
      },
      markdoc: {
        calloutTitle: resolve(dictionary?.messages?.markdoc?.calloutTitle),
        noteLabel: resolve(dictionary?.messages?.markdoc?.noteLabel),
        warningLabel: resolve(dictionary?.messages?.markdoc?.warningLabel),
        infoLabel: resolve(dictionary?.messages?.markdoc?.infoLabel),
      },
    },
  };
});

async function getPagesEntries(): Promise<PageEntryRecord[]> {
  const reader = getReader();
  const entries = await reader.collections.pages.all({ resolveLinkedFiles: true });
  return entries
    .map(({ entry }) => entry as unknown as PageEntry)
    .filter((entry) => (entry.status ?? 'draft') === 'published')
    .map((entry) => ({ entry, slugKey: entry.slugKey }));
}

async function getPostsEntries(): Promise<PostEntryRecord[]> {
  const reader = getReader();
  const entries = await reader.collections.posts.all({ resolveLinkedFiles: true });
  return entries
    .map(({ entry }) => entry as unknown as PostEntry)
    .filter((entry) => (entry.status ?? 'draft') === 'published')
    .map((entry) => ({ entry, slugKey: entry.slugKey }));
}

function buildSeoPayload(entry: PageEntry, locale: Locale): SeoEntry | undefined {
  const localized = pickLocalized(entry.seo, locale);
  return mapSeo(localized);
}

function buildCoverPayload(entry: PageEntry, locale: Locale): SeoImage | undefined {
  if (!entry.cover?.image) {
    return undefined;
  }
  const src = normalizeAssetPath(entry.cover.image);
  if (!src) {
    return undefined;
  }
  const alt = pickLocalized(entry.cover.alt, locale);
  return { src, alt: alt ?? undefined };
}

async function buildPagePayload(locale: Locale, entry: PageEntry): Promise<PagePayload> {
  const title = pickLocalized(entry.title, locale) ?? '';
  const { value: content } = await resolveLocalizedMarkdoc(entry.content, locale);
  const excerpt = pickLocalized(entry.excerpt, locale);
  const slugRecord = mapLocalizedSlugRecord(entry.slug);
  const slug = slugRecord[locale] ?? '';
  const seo = buildSeoPayload(entry, locale);
  const cover = buildCoverPayload(entry, locale);
  const entryId = typeof entry.id === 'string' ? entry.id.trim() : '';

  return {
    id: entryId || entry.slugKey,
    slugKey: entry.slugKey,
    status: entry.status ?? 'draft',
    title,
    content: content ?? null,
    excerpt,
    seo,
    cover,
    slug,
    slugByLocale: slugRecord,
    publishedAt: entry.datePublished ?? null,
    updatedAt: entry.updatedAt ?? null,
  } satisfies PagePayload;
}

async function buildPostPayload(locale: Locale, entry: PostEntry): Promise<PostPayload> {
  const base = await buildPagePayload(locale, entry);
  const canonicalUrl = pickLocalized(entry.canonicalUrl, locale);
  return {
    ...base,
    tags: entry.tags ?? [],
    author: entry.author ?? null,
    readingTime: entry.readingTime ?? null,
    canonicalUrl: canonicalUrl ?? undefined,
  } satisfies PostPayload;
}

async function getContentFileStat(
  collection: 'pages' | 'posts',
  slugKey: string,
  content?: Localized<string>
): Promise<Date | undefined> {
  if (!slugKey) {
    return undefined;
  }

  const basePath = path.join(process.cwd(), 'content', collection, `${slugKey}.json`);
  const contentReferences = collectContentReferences(content);
  const candidates = [basePath, ...contentReferences.map((reference) => reference.absolute)];

  const stats = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        return await fs.stat(candidate);
      } catch {
        return null;
      }
    })
  );

  const timestamps = stats
    .filter((stat): stat is NonNullable<typeof stat> => Boolean(stat))
    .map((stat) => stat.mtime.getTime());

  if (timestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.max(...timestamps));
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

function findEntryBySlug<T extends PageEntry | PostEntry>(
  entries: { entry: T; slugKey: string }[],
  locale: Locale,
  target: string
) {
  const normalizedTarget = normalizeSlug(target);
  return entries.find(({ entry }) => {
    const slugRecord = mapLocalizedSlugRecord(entry.slug);
    const candidate = slugRecord[locale];
    if (candidate === undefined) {
      return false;
    }
    return candidate === normalizedTarget;
  });
}

export async function getHomePage(locale: Locale): Promise<PagePayload | null> {
  const entries = await getPagesEntries();
  const match = entries.find(({ entry }) => {
    const slugRecord = mapLocalizedSlugRecord(entry.slug);
    return (slugRecord[locale] ?? undefined) === '';
  });
  if (!match) {
    return null;
  }
  return buildPagePayload(locale, match.entry);
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

export async function getPostBySlug(locale: Locale, slug: string): Promise<PostPayload | null> {
  const entries = await getPostsEntries();
  const match = findEntryBySlug(entries, locale, slug);
  if (!match) {
    return null;
  }
  const payload = await buildPostPayload(locale, match.entry);
  const fileDate = await getContentFileStat('posts', match.slugKey, match.entry.content);
  const publishedAtDate = toValidDate(match.entry.datePublished ?? null);
  const updatedAtDate = toValidDate(match.entry.updatedAt ?? null);
  const latest = mergeLatestDate(fileDate, updatedAtDate, publishedAtDate);
  return {
    ...payload,
    publishedAt: match.entry.datePublished ?? null,
    updatedAt: latest?.toISOString() ?? payload.updatedAt ?? null,
  } satisfies PostPayload;
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
      const payload = await buildPostPayload(locale, entry);
      const fileDate = await getContentFileStat('posts', slugKey, entry.content);
      const publishedAtDate = toValidDate(entry.datePublished ?? null);
      const updatedAtDate = toValidDate(entry.updatedAt ?? null);
      const latest = mergeLatestDate(fileDate, updatedAtDate, publishedAtDate);
      return {
        ...payload,
        publishedAt: entry.datePublished ?? null,
        updatedAt: latest?.toISOString() ?? payload.updatedAt ?? null,
      } satisfies PostPayload;
    })
  );

  return posts.filter((post) => Boolean(post.slug));
}

export async function getSitemapContentEntries(): Promise<SitemapContentEntry[]> {
  const [pageEntries, postEntries] = await Promise.all([getPagesEntries(), getPostsEntries()]);

  const pages = await Promise.all(
    pageEntries.map(async ({ entry, slugKey }) => {
      const slugRecord = mapLocalizedSlugRecord(entry.slug);
      const fileDate = await getContentFileStat('pages', slugKey, entry.content);
      const updatedAtDate = toValidDate(entry.updatedAt ?? null);
      const latest = mergeLatestDate(fileDate, updatedAtDate);
      return {
        collection: 'pages' as const,
        slugByLocale: slugRecord,
        lastModified: latest?.toISOString(),
      } satisfies SitemapContentEntry;
    })
  );

  const posts = await Promise.all(
    postEntries.map(async ({ entry, slugKey }) => {
      const slugRecord = mapLocalizedSlugRecord(entry.slug);
      const fileDate = await getContentFileStat('posts', slugKey, entry.content);
      const publishedAtDate = toValidDate(entry.datePublished ?? null);
      const updatedAtDate = toValidDate(entry.updatedAt ?? null);
      const latest = mergeLatestDate(fileDate, updatedAtDate, publishedAtDate);
      return {
        collection: 'posts' as const,
        slugByLocale: slugRecord,
        lastModified: latest?.toISOString(),
      } satisfies SitemapContentEntry;
    })
  );

  return [...pages, ...posts];
}