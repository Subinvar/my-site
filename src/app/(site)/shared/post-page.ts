import type { Metadata } from 'next';

import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getAllPosts, getPostBySlug, getSite, type PostContent } from '@/lib/keystatic';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveAlternateOgLocales,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';
import { locales, type Locale } from '@/lib/i18n';

export type PostPageData = {
  post: PostContent;
  content: Awaited<ReturnType<typeof render>>;
  summary: string | null;
};

type SlugMap = Partial<Record<Locale, string>>;

const buildSlugMap = (slugByLocale: Partial<Record<Locale, string>>): SlugMap => {
  const record: SlugMap = {};
  for (const candidate of locales) {
    const slug = slugByLocale[candidate];
    if (!slug) {
      continue;
    }
    record[candidate] = buildPath(candidate, ['news', slug]);
  }
  return record;
};

export async function getPostPage(locale: Locale, slug: string): Promise<PostPageData | null> {
  const post = await getPostBySlug(slug, locale);
  if (!post) {
    return null;
  }

  const content = await render(post.content, locale);
  const summary = post.description ?? post.excerpt ?? null;

  return { post, content, summary } satisfies PostPageData;
}

export async function resolvePostPageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const [site, post] = await Promise.all([getSite(locale), getPostBySlug(slug, locale)]);
  if (!post) {
    return {};
  }

  const slugMap = buildSlugMap(post.slugByLocale);
  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });
  const merged = mergeSeo({
    site: site.seo,
    page: post.seo,
    defaults: {
      title: post.title,
      description: post.description ?? post.excerpt ?? null,
    },
  });

  const canonicalUrl = merged.canonicalOverride ?? alternates.canonical;
  const alternatesData: Metadata['alternates'] = {
    languages: alternates.languages,
  };
  if (canonicalUrl) {
    alternatesData.canonical = canonicalUrl;
  }

  const currentHrefLang = HREFLANG_CODE[locale];
  const preferredUrl = canonicalUrl ?? alternates.languages[currentHrefLang];
  const ogImage = resolveOpenGraphImage(merged.ogImage, site.seo.canonicalBase);
  const alternateOgLocales = resolveAlternateOgLocales(locale, slugMap);
  const descriptionFallback = merged.description ?? post.description ?? post.excerpt ?? undefined;
  const ogDescriptionFallback = merged.ogDescription ?? descriptionFallback;
  const ogTitleFallback = merged.ogTitle ?? merged.title ?? post.title;

  return {
    title: merged.title ?? post.title,
    description: descriptionFallback,
    alternates: alternatesData,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'article',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      publishedTime: post.date ?? undefined,
      alternateLocale: alternateOgLocales.length ? alternateOgLocales : undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  } satisfies Metadata;
}

export async function getLocalizedPostParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  const posts = await getAllPosts();
  const params: { locale: Locale; slug: string }[] = [];
  const seen = new Set<string>();

  for (const post of posts) {
    if (!post.published) {
      continue;
    }
    for (const locale of locales) {
      const slug = post.slugByLocale[locale];
      if (!slug) {
        continue;
      }
      const key = `${locale}:${slug}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      params.push({ locale, slug });
    }
  }

  return params;
}