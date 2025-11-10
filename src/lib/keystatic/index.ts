import { cache } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { createReader } from '@keystatic/core/reader';
import config from '../../../keystatic.config';
import { FALLBACK_LOCALE, Locale } from '../i18n';

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
  label?: Localized<string>;
  link?: {
    discriminant: 'internal' | 'external';
    value?:
      | {
          page?: string | null;
        }
      | {
          url?: string | null;
          newTab?: boolean | null;
        };
  } | null;
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
  content?: Localized<{ node: unknown }>;
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
  localizedSlugs: Partial<Record<Locale, string>>;
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
  slugKey: string;
  status: 'draft' | 'published';
  title: string;
  slug: string;
  localizedSlugs: Partial<Record<Locale, string>>;
  excerpt?: string;
  content?: { node: unknown };
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
  localizedSlugs: Partial<Record<Locale, string>>;
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

function pickLocalized<T>(value: Localized<T> | undefined | null, locale: Locale, options?: { fallback?: boolean }): T | undefined {
  if (!value) return undefined;
  if (value[locale] !== undefined) {
    return value[locale];
  }
  if (options?.fallback === false) {
    return undefined;
  }
  return value[FALLBACK_LOCALE];
}

function mapLocalizedSlugRecord(slugs: Localized<SlugFieldValue | string> | undefined | null): Partial<Record<Locale, string>> {
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
    siteName: pickLocalized(brandEntry.siteName, locale) ?? pickLocalized(brandEntry.siteName, FALLBACK_LOCALE) ?? brandEntry.companyName ?? '',
    tagline: pickLocalized(brandEntry.tagline, locale),
    logo: (() => {
      const src = normalizeAssetPath(brandEntry.logo?.image ?? null);
      if (!src) {
        return undefined;
      }
      const alt = pickLocalized(brandEntry.logo?.alt, locale) ?? pickLocalized(brandEntry.logo?.alt, FALLBACK_LOCALE);
      return { src, alt: alt ?? undefined } satisfies SeoImage;
    })(),
    contacts: {
      phone: brandEntry.contacts?.phone ?? undefined,
      email: brandEntry.contacts?.email ?? undefined,
      address: pickLocalized(brandEntry.contacts?.address, locale) ?? pickLocalized(brandEntry.contacts?.address, FALLBACK_LOCALE),
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

  const localizedSeo = pickLocalized(site?.defaultSeo, locale);
  const fallbackSeo = pickLocalized(site?.defaultSeo, FALLBACK_LOCALE);
  const seo = localizedSeo ?? fallbackSeo ?? undefined;
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

function mapNavigationEntry(
  locale: Locale,
  entry: NavigationEntry,
  pageIndex: Map<string, { entry: PageEntry; slugs: Partial<Record<Locale, string>> }>
): NavigationLink | null {
  const label = pickLocalized(entry.label, locale) ?? pickLocalized(entry.label, FALLBACK_LOCALE);
  if (!label) {
    return null;
  }
  const order = entry.order ?? 0;
  const link = entry.link;
  if (!link) {
    return null;
  }
  if (link.discriminant === 'external') {
    const value = link.value as { url?: string | null; newTab?: boolean | null } | undefined;
    if (!value?.url) {
      return null;
    }
    return {
      kind: 'external',
      label,
      url: value.url,
      newTab: Boolean(value.newTab),
      order,
    } satisfies NavigationLinkExternal;
  }
  const value = link.value as { page?: string | null } | undefined;
  if (!value?.page) {
    return null;
  }
  const linked = pageIndex.get(value.page);
  if (!linked) {
    return null;
  }
  const slug = linked.slugs[locale];
  if (slug === undefined) {
    return null;
  }
  return {
    kind: 'internal',
    label,
    slug,
    localizedSlugs: linked.slugs,
    order,
  } satisfies NavigationLinkInternal;
}

function sortNavigationLinks(links: NavigationLink[]): NavigationLink[] {
  return [...links].sort((a, b) => a.order - b.order);
}

export async function getNavigation(locale: Locale): Promise<NavigationResult> {
  const reader = getReader();
  const [nav, pages] = await Promise.all([
    reader.singletons.navigation.read({ resolveLinkedFiles: true }) as Promise<NavigationSingleton>,
    getPagesEntries(),
  ]);

  const pageIndex = new Map<string, { entry: PageEntry; slugs: Partial<Record<Locale, string>> }>();
  for (const { entry } of pages) {
    const slugs = mapLocalizedSlugRecord(entry.slug);
    pageIndex.set(entry.slugKey, { entry, slugs });
  }

  const build = (entries: NavigationEntry[] | undefined) =>
    sortNavigationLinks(
      (entries ?? [])
        .map((entry) => mapNavigationEntry(locale, entry, pageIndex))
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
  const localized = pickLocalized(entry.seo, locale) ?? pickLocalized(entry.seo, FALLBACK_LOCALE);
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
  const alt = pickLocalized(entry.cover.alt, locale) ?? pickLocalized(entry.cover?.alt, FALLBACK_LOCALE);
  return { src, alt: alt ?? undefined };
}

function buildPagePayload(locale: Locale, entry: PageEntry): PagePayload {
  const title = pickLocalized(entry.title, locale) ?? pickLocalized(entry.title, FALLBACK_LOCALE) ?? '';
  const content = pickLocalized(entry.content, locale) ?? pickLocalized(entry.content, FALLBACK_LOCALE);
  const excerpt = pickLocalized(entry.excerpt, locale) ?? pickLocalized(entry.excerpt, FALLBACK_LOCALE);
  const slugRecord = mapLocalizedSlugRecord(entry.slug);
  const slug = slugRecord[locale] ?? '';
  const seo = buildSeoPayload(entry, locale);
  const cover = buildCoverPayload(entry, locale);

  return {
    slugKey: entry.slugKey,
    status: entry.status ?? 'draft',
    title,
    content,
    excerpt,
    seo,
    cover,
    slug,
    localizedSlugs: slugRecord,
    publishedAt: entry.datePublished ?? null,
    updatedAt: entry.updatedAt ?? null,
  } satisfies PagePayload;
}

function buildPostPayload(locale: Locale, entry: PostEntry): PostPayload {
  const base = buildPagePayload(locale, entry);
  const canonicalUrl = pickLocalized(entry.canonicalUrl, locale) ?? pickLocalized(entry.canonicalUrl, FALLBACK_LOCALE);
  return {
    ...base,
    tags: entry.tags ?? [],
    author: entry.author ?? null,
    readingTime: entry.readingTime ?? null,
    canonicalUrl: canonicalUrl ?? undefined,
  } satisfies PostPayload;
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

function findEntryBySlug<T extends PageEntry | PostEntry>(entries: { entry: T; slugKey: string }[], locale: Locale, target: string) {
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
  const payload = buildPostPayload(locale, match.entry);
  const fileDate = await getContentFileStat('posts', match.slugKey);
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
      const payload = buildPostPayload(locale, entry);
      const fileDate = await getContentFileStat('posts', slugKey);
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
      const fileDate = await getContentFileStat('pages', slugKey);
      const updatedAtDate = toValidDate(entry.updatedAt ?? null);
      const latest = mergeLatestDate(fileDate, updatedAtDate);
      return {
        collection: 'pages' as const,
        localizedSlugs: slugRecord,
        lastModified: latest?.toISOString(),
      } satisfies SitemapContentEntry;
    })
  );

  const posts = await Promise.all(
    postEntries.map(async ({ entry, slugKey }) => {
      const slugRecord = mapLocalizedSlugRecord(entry.slug);
      const fileDate = await getContentFileStat('posts', slugKey);
      const publishedAtDate = toValidDate(entry.datePublished ?? null);
      const updatedAtDate = toValidDate(entry.updatedAt ?? null);
      const latest = mergeLatestDate(fileDate, updatedAtDate, publishedAtDate);
      return {
        collection: 'posts' as const,
        localizedSlugs: slugRecord,
        lastModified: latest?.toISOString(),
      } satisfies SitemapContentEntry;
    })
  );

  return [...pages, ...posts];
}