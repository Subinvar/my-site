import type { MetadataRoute } from 'next';
import { buildPath } from '@/lib/paths';
import { getAllPages, getAllPosts } from '@/lib/keystatic';
import { locales, type Locale } from '@/lib/i18n';

function buildAlternates(collection: 'pages' | 'posts', slugByLocale: Partial<Record<Locale, string>>) {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const slug = slugByLocale[locale];
    if (slug === undefined) {
      continue;
    }
    const segments = collection === 'posts' ? ['posts', slug] : slug ? [slug] : [];
    languages[locale] = buildPath(locale, segments);
  }
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts] = await Promise.all([getAllPages(), getAllPosts()]);
  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    if (!page.published) {
      continue;
    }
    const languages = buildAlternates('pages', page.slugByLocale);
    for (const locale of locales) {
      if (!(locale in languages)) {
        continue;
      }
      const url = languages[locale];
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
    const languages = buildAlternates('posts', post.slugByLocale);
    for (const locale of locales) {
      if (!(locale in languages)) {
        continue;
      }
      const url = languages[locale];
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