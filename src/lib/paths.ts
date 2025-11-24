import { defaultLocale, locales, type Locale } from './i18n';

type PathSegment = string | null | undefined;

type LocalizedSlugs = Partial<Record<Locale, string | null | undefined>>;

type EntityWithLocalizedSlugs = {
  collection: 'pages' | 'posts' | 'catalog';
  slugs: LocalizedSlugs;
};

export function buildPath(locale: Locale, segments: PathSegment[] = []): string {
  const filtered = segments
    .flatMap((segment) => (Array.isArray(segment) ? segment : [segment]))
    .filter((segment): segment is string => typeof segment === 'string' && segment.length > 0);
  const suffix = filtered.length ? `/${filtered.map(encodeURIComponent).join('/')}` : '';
  if (locale === defaultLocale) {
    return suffix.length ? suffix : '/';
  }
  return `/${locale}${suffix}`;
}

export function switchLocalePath(
  currentLocale: Locale,
  targetLocale: Locale,
  entity?: EntityWithLocalizedSlugs
): string | null {
  if (currentLocale === targetLocale) {
    return buildPath(targetLocale);
  }

  if (!entity) {
    return buildPath(targetLocale);
  }

  const slug = entity.slugs[targetLocale];
  if (slug === undefined || slug === null) {
    return null;
  }

  const normalized = slug.trim();
  let segments: string[] = [];
  if (entity.collection === 'posts') {
    segments = ['news'];
  } else if (entity.collection === 'catalog') {
    segments = ['catalog'];
  }
  if (normalized.length > 0) {
    segments.push(normalized);
  }

  return buildPath(targetLocale, segments);
}

export function findTargetLocale(currentLocale: Locale): Locale {
  return locales.find((candidate) => candidate !== currentLocale) ?? currentLocale;
}

export type { EntityWithLocalizedSlugs };