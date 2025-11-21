import { defaultLocale, locales, type Locale } from './i18n';
import type { ResolvedSeo, SeoImage, SiteSeo } from './keystatic';

export const HREFLANG_CODE: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

export const OPEN_GRAPH_LOCALE: Record<Locale, string> = {
  ru: 'ru_RU',
  en: 'en_US',
};

const FALLBACK_OG_DIMENSIONS = {
  width: 1200,
  height: 630,
};

const MIME_BY_EXTENSION: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
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

type SlugMap = Partial<Record<Locale, string | null | undefined>>;

type BuildAlternatesOptions = {
  locale: Locale;
  slugMap: SlugMap;
  canonicalBase?: string | null;
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
    languages[HREFLANG_CODE[candidate]] = href;
  }

  const canonicalSlug = slugMap[locale];
  const canonical = canonicalSlug
    ? (() => {
        const normalized = normalizePath(canonicalSlug);
        return base ? `${base}${normalized}` : normalized || '/';
      })()
    : undefined;

  const defaultSlug = slugMap[defaultLocale];
  if (defaultSlug !== undefined && defaultSlug !== null) {
    const normalized = normalizePath(defaultSlug);
    const href = base ? `${base}${normalized}` : normalized || '/';
    languages['x-default'] = href;
  }

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

  return {
    title: title ?? undefined,
    description: description ?? undefined,
    ogTitle: ogTitle ?? undefined,
    ogDescription: ogDescription ?? undefined,
    ogImage,
    canonicalOverride,
  } satisfies MergedSeo;
};

const toAbsolutePath = (value: string): string => {
  if (value.startsWith('/')) {
    return value;
  }
  const normalized = value.replace(/^\/+/g, '');
  return `/${normalized}`;
};

export const toAbsoluteUrl = (
  value: string | null | undefined,
  canonicalBase?: string | null
): string | undefined => {
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
  const path = toAbsolutePath(trimmed);
  if (!canonicalBase) {
    return path;
  }
  const base = canonicalBase.replace(/\/+$/, '');
  return `${base}${path}`;
};

const extractExtension = (src: string): string | undefined => {
  const withoutParams = src.split('?')[0]?.split('#')[0];
  if (!withoutParams) {
    return undefined;
  }
  const segments = withoutParams.split('.');
  const extension = segments.length > 1 ? segments.pop() : undefined;
  return extension?.toLowerCase();
};

export const resolveOpenGraphImage = (
  image: SeoImage | null | undefined,
  canonicalBase?: string | null
) => {
  if (!image) {
    return undefined;
  }
  const absoluteUrl = toAbsoluteUrl(image.src, canonicalBase) ?? image.src;
  const width = image.width ?? FALLBACK_OG_DIMENSIONS.width;
  const height = image.height ?? FALLBACK_OG_DIMENSIONS.height;
  const extension = extractExtension(image.src ?? '');
  const type = extension ? MIME_BY_EXTENSION[extension] ?? undefined : undefined;

  return {
    url: absoluteUrl,
    width,
    height,
    alt: image.alt ?? undefined,
    type,
  };
};

export const resolveAlternateOgLocales = (
  currentLocale: Locale,
  slugMap: SlugMap
): string[] => {
  return locales
    .filter((candidate) => candidate !== currentLocale && slugMap[candidate] !== undefined && slugMap[candidate] !== null)
    .map((candidate) => OPEN_GRAPH_LOCALE[candidate]);
};

export const resolveRobotsMeta = ({
  index,
  follow,
}: {
  index: boolean;
  follow: boolean;
}) => {
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  const isProduction = environment === 'production';
  if (!isProduction) {
    return {
      index: false,
      follow: false,
    } as const;
  }
  return {
    index,
    follow,
  } as const;
};