import type { Metadata } from 'next';
import { localizePath, type Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './i18n';

type SeoInfo = {
  title?: string;
  description?: string;
};

type MetadataParams = {
  locale: Locale;
  slug: string;
  siteSeo?: SeoInfo;
  pageSeo?: SeoInfo;
  localizedSlugs?: Partial<Record<Locale, string>>;
  siteName?: string;
  ogImageAlt?: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function buildPageMetadata({ locale, slug, siteSeo, pageSeo, localizedSlugs, siteName, ogImageAlt }: MetadataParams): Metadata {
  const title = pageSeo?.title ?? siteSeo?.title;
  const description = pageSeo?.description ?? siteSeo?.description;
  const canonicalPath = localizePath(locale, slug);
  const canonical = new URL(canonicalPath, siteUrl).toString();

  const languages: Record<string, string> = {};
  for (const candidate of SUPPORTED_LOCALES) {
    const translatedSlug = localizedSlugs?.[candidate];
    if (translatedSlug === undefined) {
      continue;
    }
    languages[candidate] = new URL(localizePath(candidate, translatedSlug), siteUrl).toString();
  }

  if (languages[DEFAULT_LOCALE]) {
    languages['x-default'] = languages[DEFAULT_LOCALE];
  }

  const ogImages = ogImageAlt
    ? [
        {
          url: new URL(`/og-${locale}.svg`, siteUrl).toString(),
          alt: ogImageAlt,
          type: 'image/svg+xml',
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
      locale,
      alternateLocale: Object.keys(languages).filter((code) => code !== locale),
      url: canonical,
      siteName: siteName ?? undefined,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: title ?? undefined,
      description: description ?? undefined,
      images: ogImages?.map((image) => image.url),
    },
  };
}