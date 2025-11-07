import type { Metadata } from 'next';
import { localizePath, type Locale, SUPPORTED_LOCALES } from './i18n';

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
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function buildPageMetadata({ locale, slug, siteSeo, pageSeo, localizedSlugs }: MetadataParams): Metadata {
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
    },
  };
}