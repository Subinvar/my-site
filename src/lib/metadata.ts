import type { Metadata } from 'next';
import { locales, type Locale, toLanguageTag } from './i18n';
import { buildAbsoluteUrl } from './site-url';
import { buildAlternates } from './seo';

type OgImage = {
  src: string;
  alt?: string;
};

type SeoInfo = {
  title?: string;
  description?: string;
  ogImage?: OgImage;
};

type MetadataParams = {
  locale: Locale;
  slug: string;
  siteSeo?: SeoInfo;
  pageSeo?: SeoInfo;
  slugByLocale?: Partial<Record<Locale, string>>;
  siteName?: string;
  ogImageAlt?: string;
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'player' | 'app';
    site?: string;
    creator?: string;
  } | null;
};

export function buildPageMetadata({
  locale,
  slug,
  siteSeo,
  pageSeo,
  slugByLocale,
  siteName,
  ogImageAlt,
  twitter,
}: MetadataParams): Metadata {
  const title = pageSeo?.title ?? siteSeo?.title;
  const description = pageSeo?.description ?? siteSeo?.description;
  const slugMap = { ...(slugByLocale ?? {}), [locale]: slug } satisfies Partial<Record<Locale, string>>;
  const { canonical, languages } = buildAlternates({ locale, slugByLocale: slugMap });

  const languageTag = toLanguageTag(locale);
  const openGraphLocale = languageTag.replace('-', '_');
  const openGraphAlternateLocales = locales
    .filter((candidate) => candidate !== locale && slugMap[candidate] !== undefined)
    .map((candidate) => toLanguageTag(candidate).replace('-', '_'));

  const ogImage = pageSeo?.ogImage ?? siteSeo?.ogImage;
  const ogImages = ogImage
    ? [
        {
          url: buildAbsoluteUrl(ogImage.src),
          alt: ogImage.alt ?? ogImageAlt,
        },
      ]
    : ogImageAlt
      ? [
          {
            url: buildAbsoluteUrl(`/og-${locale}.svg`),
            alt: ogImageAlt,
          },
        ]
      : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: title ?? undefined,
      description: description ?? undefined,
      locale: openGraphLocale,
      alternateLocale: openGraphAlternateLocales,
      url: canonical,
      siteName: siteName ?? undefined,
      images: ogImages,
    },
    twitter: {
      card: twitter?.card ?? 'summary_large_image',
      title: title ?? undefined,
      description: description ?? undefined,
      images: ogImages?.map((image) => image.url),
      site: twitter?.site ?? undefined,
      creator: twitter?.creator ?? undefined,
    },
  };
}