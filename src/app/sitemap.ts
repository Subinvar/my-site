import type { MetadataRoute } from 'next';
import { buildPath } from '@/lib/paths';
import { getAllPages, getAllPosts, getSite } from '@/lib/keystatic';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';
import { HREFLANG_CODE, toAbsoluteUrl } from '@/lib/seo';

function buildAlternateLanguages(
  collection: 'pages' | 'posts',
  slugByLocale: Partial<Record<Locale, string>>,
  canonicalBase?: string | null
) {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const slug = slugByLocale[locale];
    if (slug === undefined || slug === null) {
      continue;
    }
    if (collection === 'posts' && !slug) {
      continue;
    }
    const segments = collection === 'posts' ? ['posts', slug] : slug ? [slug] : [];
    const relative = buildPath(locale, segments);
    languages[HREFLANG_CODE[locale]] = toAbsoluteUrl(relative, canonicalBase) ?? relative;
  }

  const defaultSlug = slugByLocale[defaultLocale];
  if (defaultSlug !== undefined && defaultSlug !== null) {
    const segments = collection === 'posts' ? ['posts', defaultSlug] : defaultSlug ? [defaultSlug] : [];
    const relative = buildPath(defaultLocale, segments);
    languages['x-default'] = toAbsoluteUrl(relative, canonicalBase) ?? relative;
  }

  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts, site] = await Promise.all([getAllPages(), getAllPosts(), getSite(defaultLocale)]);
  const canonicalBase = site.seo.canonicalBase;
  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    if (!page.published) {
      continue;
    }
    const languages = buildAlternateLanguages('pages', page.slugByLocale, canonicalBase);
    for (const locale of locales) {
      const hrefLang = HREFLANG_CODE[locale];
      const url = languages[hrefLang];
      if (!url) {
        continue;
      }
      entries.push({
        url,
        alternates: { languages },
        changeFrequency: page.slugByLocale[locale] ? 'monthly' : 'weekly',
        priority: page.slugByLocale[locale] ? 0.6 : 0.9,
        lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
      });
    }
  }

  for (const post of posts) {
    if (!post.published) {
      continue;
    }
    const languages = buildAlternateLanguages('posts', post.slugByLocale, canonicalBase);
    for (const locale of locales) {
      const hrefLang = HREFLANG_CODE[locale];
      const url = languages[hrefLang];
      if (!url) {
        continue;
      }
      entries.push({
        url,
        alternates: { languages },
        changeFrequency: 'monthly',
        lastModified: post.updatedAt ? new Date(post.updatedAt) : post.date ? new Date(post.date) : undefined,
      });
    }
  }

  return entries;
}