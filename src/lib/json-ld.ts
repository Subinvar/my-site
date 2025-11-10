import { localizePath, type Locale, toLanguageTag } from './i18n';
import { buildAbsoluteUrl, getSiteUrl } from './site-url';

export type BreadcrumbInput = {
  name: string;
  href?: string;
};

export function buildOrganizationJsonLd({
  locale,
  name,
  description,
  email,
  phone,
  address,
  logoUrl,
}: {
  locale: Locale;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}) {
  const languageTag = toLanguageTag(locale);
  const contactPoint = phone || email
    ? [
        {
          '@type': 'ContactPoint',
          telephone: phone,
          email,
          contactType: 'customer support',
          availableLanguage: [languageTag],
        },
      ]
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    description,
    inLanguage: languageTag,
    url: getSiteUrl(),
    email,
    telephone: phone,
    address: address
      ? {
          '@type': 'PostalAddress',
          streetAddress: address,
        }
      : undefined,
    logo: logoUrl
      ? {
          '@type': 'ImageObject',
          url: logoUrl,
        }
      : undefined,
    contactPoint,
  };
}

export function buildWebsiteJsonLd({
  locale,
  name,
  description,
  alternateLocales,
  searchUrl,
}: {
  locale: Locale;
  name: string;
  description?: string;
  alternateLocales: Locale[];
  searchUrl?: string | null;
}) {
  const languageTag = toLanguageTag(locale);
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url: siteUrl,
    inLanguage: languageTag,
    alternateName: alternateLocales.length
      ? alternateLocales.map((item) => `${name} (${toLanguageTag(item)})`)
      : undefined,
    potentialAction: searchUrl
      ? {
          '@type': 'SearchAction',
          target: `${searchUrl}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        }
      : undefined,
  };
}

export function buildBreadcrumbListJsonLd({
  locale,
  rootLabel,
  items,
  current,
}: {
  locale: Locale;
  rootLabel: string;
  items: BreadcrumbInput[];
  current: BreadcrumbInput;
}) {
  const languageTag = toLanguageTag(locale);
  const list = [
    {
      '@type': 'ListItem',
      position: 1,
      name: rootLabel,
      item: buildAbsoluteUrl(localizePath(locale, '')),
    },
    ...items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: item.name,
      item: item.href ? buildAbsoluteUrl(item.href) : undefined,
    })),
    {
      '@type': 'ListItem',
      position: items.length + 2,
      name: current.name,
      item: current.href ? buildAbsoluteUrl(current.href) : undefined,
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    inLanguage: languageTag,
    itemListElement: list,
  };
}

export function buildArticleJsonLd({
  locale,
  headline,
  description,
  url,
  imageUrl,
  imageAlt,
  datePublished,
  dateModified,
  publisherName,
}: {
  locale: Locale;
  headline: string;
  description?: string;
  url: string;
  imageUrl?: string;
  imageAlt?: string;
  datePublished?: string | null;
  dateModified?: string | null;
  publisherName: string;
}) {
  const languageTag = toLanguageTag(locale);
  const normalizedDateModified = dateModified ?? datePublished ?? null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    inLanguage: languageTag,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    datePublished: datePublished ?? undefined,
    dateModified: normalizedDateModified ?? undefined,
    image: imageUrl
      ? [
          {
            '@type': 'ImageObject',
            url: imageUrl,
            description: imageAlt,
          },
        ]
      : undefined,
    author: {
      '@type': 'Organization',
      name: publisherName,
      url: getSiteUrl(),
    },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: imageUrl
        ? {
            '@type': 'ImageObject',
            url: imageUrl,
            description: imageAlt,
          }
        : undefined,
    },
  };
}