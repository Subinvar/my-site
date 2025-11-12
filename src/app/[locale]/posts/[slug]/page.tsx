import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getAllPosts, getPostBySlug, getSite } from '@/lib/keystatic';
import { buildAlternates, mergeSeo } from '@/lib/seo';
import { isLocale, locales, type Locale } from '@/lib/i18n';

type PostPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

const OPEN_GRAPH_LOCALE: Record<Locale, string> = { ru: 'ru_RU', en: 'en_US' };

const HREFLANG_CODE: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

const toAbsoluteUrl = (value: string | undefined, canonicalBase?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (/^https?:\/\//.test(value)) {
    return value;
  }
  if (!canonicalBase) {
    return value;
  }
  const base = canonicalBase.replace(/\/+$/, '');
  return `${base}${value}`;
};

const buildSlugMap = (slugByLocale: Partial<Record<Locale, string>>): Partial<Record<Locale, string>> => {
  const record: Partial<Record<Locale, string>> = {};
  for (const candidate of locales) {
    const slug = slugByLocale[candidate];
    if (!slug) {
      continue;
    }
    record[candidate] = buildPath(candidate, ['posts', slug]);
  }
  return record;
};

export default async function PostPage({ params }: PostPageProps) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const post = await getPostBySlug(slug, locale);
  if (!post) {
    notFound();
  }

  const content = await render(post.content, locale);
  const summary = post.description ?? post.excerpt;

  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert">
      <header className="mb-8 space-y-3">
        <p className="text-sm uppercase tracking-wide text-zinc-500">{post.date}</p>
        <h1 className="text-3xl font-semibold text-zinc-900">{post.title}</h1>
        {summary ? <p className="text-base text-zinc-600">{summary}</p> : null}
      </header>
      <div className="prose-h2:mt-8 prose-h3:mt-6 prose-p:leading-relaxed">{content}</div>
      {post.tags.length ? (
        <ul className="mt-10 flex flex-wrap gap-2 text-sm text-zinc-500">
          {post.tags.map((tag) => (
            <li key={tag} className="rounded-full border border-zinc-200 px-3 py-1">
              #{tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export async function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>> {
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

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
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
  const ogImageUrl = toAbsoluteUrl(merged.ogImage?.src, site.seo.canonicalBase);
  const descriptionFallback = merged.description ?? post.description ?? post.excerpt ?? undefined;
  const ogDescriptionFallback = merged.ogDescription ?? descriptionFallback;
  const ogTitleFallback = merged.ogTitle ?? merged.title ?? post.title;

  return {
    title: merged.title ?? post.title,
    description: descriptionFallback,
    alternates: alternatesData,
    openGraph: {
      type: 'article',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      publishedTime: post.date ?? undefined,
      images: merged.ogImage
        ? [
            {
              url: ogImageUrl ?? merged.ogImage.src,
              width: merged.ogImage.width ?? undefined,
              height: merged.ogImage.height ?? undefined,
              alt: merged.ogImage.alt ?? undefined,
            },
          ]
        : undefined,
    },
    twitter: {
      card: merged.ogImage ? 'summary_large_image' : 'summary',
      site: merged.twitterHandle,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      images: merged.ogImage ? [ogImageUrl ?? merged.ogImage.src] : undefined,
    },
  } satisfies Metadata;
}