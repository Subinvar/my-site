import { defaultLocale, locales, localizePath, type Locale, toLanguageTag } from './i18n';
import { getSiteUrl } from './site-url';

type SlugMap = Partial<Record<Locale, string | undefined>>;

type AlternatesInput = {
  locale: Locale;
  slugByLocale: SlugMap;
  baseUrl?: string;
};

function resolveBaseUrl(candidate?: string): string {
  const fallback = getSiteUrl();
  if (!candidate) {
    return fallback;
  }
  try {
    const url = new URL(candidate.startsWith('http') ? candidate : `https://${candidate}`);
    return url.origin;
  } catch {
    return fallback;
  }
}

export function buildAlternates({ locale, slugByLocale, baseUrl }: AlternatesInput): {
  canonical: string;
  languages: Record<string, string>;
} {
  const origin = resolveBaseUrl(baseUrl);
  const languages: Record<string, string> = {};

  for (const candidate of locales) {
    const slug = slugByLocale[candidate];
    if (slug === undefined) {
      continue;
    }
    const href = new URL(localizePath(candidate, slug ?? ''), origin).toString();
    languages[candidate] = href;
  }

  const canonical = languages[locale] ?? new URL(localizePath(locale, slugByLocale[locale] ?? ''), origin).toString();

  if (languages[defaultLocale]) {
    languages['x-default'] = languages[defaultLocale];
  } else if (!languages['x-default']) {
    languages['x-default'] = canonical;
  }

  return { canonical, languages };
}

type ArticleJsonLdParams = {
  locale: Locale;
  slugByLocale: SlugMap;
  baseUrl?: string;
  headline: string;
  description?: string;
  image?: { url: string; alt?: string };
  datePublished?: string | null;
  dateModified?: string | null;
  siteName: string;
  authorName?: string;
};

function resolveImageUrl(url: string | undefined, baseUrl: string): string | undefined {
  if (!url) {
    return undefined;
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return new URL(normalized, baseUrl).toString();
}

export function buildArticleJsonLd({
  locale,
  slugByLocale,
  baseUrl,
  headline,
  description,
  image,
  datePublished,
  dateModified,
  siteName,
  authorName,
}: ArticleJsonLdParams) {
  const { canonical } = buildAlternates({ locale, slugByLocale, baseUrl });
  const languageTag = toLanguageTag(locale);
  const normalizedImage = image?.url
    ? {
        '@type': 'ImageObject',
        url: resolveImageUrl(image.url, resolveBaseUrl(baseUrl)),
        description: image.alt,
      }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    inLanguage: languageTag,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    url: canonical,
    datePublished: datePublished ?? undefined,
    dateModified: (dateModified ?? datePublished) ?? undefined,
    image: normalizedImage ? [normalizedImage] : undefined,
    author: authorName
      ? {
          '@type': 'Person',
          name: authorName,
        }
      : {
          '@type': 'Organization',
          name: siteName,
          url: resolveBaseUrl(baseUrl),
        },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: normalizedImage,
    },
  };
}

type WebsiteJsonLdParams = {
  locale: Locale;
  slugByLocale: SlugMap;
  baseUrl?: string;
  name: string;
  description?: string;
  searchUrl?: string | null;
};

export function buildWebsiteJsonLd({
  locale,
  slugByLocale,
  baseUrl,
  name,
  description,
  searchUrl,
}: WebsiteJsonLdParams) {
  const { canonical } = buildAlternates({ locale, slugByLocale, baseUrl });
  const languageTag = toLanguageTag(locale);
  const alternateNames = locales
    .filter((candidate) => candidate !== locale)
    .map((candidate) => `${name} (${toLanguageTag(candidate)})`);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url: canonical,
    inLanguage: languageTag,
    alternateName: alternateNames.length ? alternateNames : undefined,
    potentialAction: searchUrl
      ? {
          '@type': 'SearchAction',
          target: `${searchUrl}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        }
      : undefined,
  };
}