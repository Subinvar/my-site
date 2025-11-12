import { locales, type Locale } from './i18n';
import type { ResolvedSeo, SeoImage, SiteSeo } from './keystatic';

const HREFLANG_MAP: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

type SlugMap = Partial<Record<Locale, string | null | undefined>>;

type BuildAlternatesOptions = {
  locale: Locale;
  slugMap: SlugMap;
  canonicalBase?: string | null;
};

const normalizePath = (path: string): string => {
  if (!path) {
    return '';
  }
  if (path.startsWith('/')) {
    return path;
  }
  const trimmed = path.replace(/^\/+/g, '');
  return `/${trimmed}`;
};

export const buildAlternates = ({
  locale,
  slugMap,
  canonicalBase,
}: BuildAlternatesOptions): {
  canonical?: string;
  languages: Record<string, string>;
} => {
  const base = canonicalBase ? canonicalBase.replace(/\/+$/, '') : undefined;
  const languages: Record<string, string> = {};

  for (const candidate of locales) {
    const slug = slugMap[candidate];
    if (!slug) {
      continue;
    }
    const normalized = normalizePath(slug);
    const href = base ? `${base}${normalized}` : normalized || '/';
    languages[HREFLANG_MAP[candidate]] = href;
  }

  const canonicalSlug = slugMap[locale];
  const canonical = canonicalSlug
    ? (() => {
        const normalized = normalizePath(canonicalSlug);
        return base ? `${base}${normalized}` : normalized || '/';
      })()
    : undefined;

  return { canonical, languages };
};

type MergeSeoInput = {
  site: SiteSeo;
  page?: ResolvedSeo | null;
  defaults?: {
    title?: string | null;
    description?: string | null;
  };
};

export type MergedSeo = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: SeoImage | null;
  canonicalOverride?: string;
  twitterHandle?: string;
};

export const mergeSeo = ({ site, page, defaults }: MergeSeoInput): MergedSeo => {
  const fallbackTitle = defaults?.title ?? undefined;
  const fallbackDescription = defaults?.description ?? undefined;
  const title = page?.title ?? fallbackTitle ?? site.title ?? undefined;
  const description = page?.description ?? fallbackDescription ?? site.description ?? undefined;
  const ogTitle =
    page?.ogTitle ??
    page?.title ??
    fallbackTitle ??
    site.ogTitle ??
    site.title ??
    title ??
    undefined;
  const ogDescription =
    page?.ogDescription ??
    page?.description ??
    fallbackDescription ??
    site.ogDescription ??
    site.description ??
    description ??
    undefined;
  const ogImage = page?.ogImage ?? site.ogImage ?? null;
  const canonicalOverride = page?.canonicalOverride ?? undefined;
  const twitterHandle = site.twitterHandle ?? undefined;

  return {
    title: title ?? undefined,
    description: description ?? undefined,
    ogTitle: ogTitle ?? undefined,
    ogDescription: ogDescription ?? undefined,
    ogImage,
    canonicalOverride,
    twitterHandle,
  } satisfies MergedSeo;
};