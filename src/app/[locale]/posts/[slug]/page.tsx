import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getAllPosts, getPostAlternates, getPostBySlug, getSite } from '@/lib/keystatic';
import { isLocale, locales, type Locale } from '@/lib/i18n';

type PostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function resolveAlternates(slugByLocale: Partial<Record<Locale, string>>) {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const slug = slugByLocale[locale];
    if (!slug) {
      continue;
    }
    languages[locale] = buildPath(locale, ['posts', slug]);
  }
  return { languages };
}

function resolveOpenGraph({
  locale,
  slug,
  title,
  description,
  ogImage,
  publishedAt,
}: {
  locale: Locale;
  slug: string;
  title?: string | null;
  description?: string | null;
  ogImage?: { src: string; alt?: string | null } | null;
  publishedAt?: string | null;
}): Metadata['openGraph'] {
  const url = buildPath(locale, ['posts', slug]);
  return {
    type: 'article',
    locale,
    url,
    title: title ?? undefined,
    description: description ?? undefined,
    publishedTime: publishedAt ?? undefined,
    images: ogImage ? [{ url: ogImage.src, alt: ogImage.alt ?? undefined }] : undefined,
  };
}

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

  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert">
      <header className="mb-8 space-y-3">
        <p className="text-sm uppercase tracking-wide text-zinc-500">{post.date}</p>
        <h1 className="text-3xl font-semibold text-zinc-900">{post.title}</h1>
        {post.excerpt ? <p className="text-base text-zinc-600">{post.excerpt}</p> : null}
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

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const params: { locale: Locale; slug: string }[] = [];
  for (const post of posts) {
    if (!post.published) {
      continue;
    }
    for (const locale of locales) {
      const slug = post.slugByLocale[locale];
      if (!slug) {
        continue;
      }
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
  const alternates = await getPostAlternates(post.id);
  const title = post.seo?.title ?? post.title ?? site.defaultSeo?.title ?? undefined;
  const description = post.seo?.description ?? site.defaultSeo?.description ?? undefined;
  const ogImage = post.seo?.ogImage ?? site.defaultSeo?.ogImage ?? undefined;
  return {
    title,
    description,
    alternates: resolveAlternates(alternates),
    openGraph: resolveOpenGraph({
      locale,
      slug: post.slug,
      title,
      description,
      ogImage,
      publishedAt: post.date ?? undefined,
    }),
  } satisfies Metadata;
}