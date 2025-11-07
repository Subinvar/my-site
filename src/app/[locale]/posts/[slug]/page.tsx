import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { renderMarkdoc } from '@/lib/markdoc';
import { buildPageMetadata } from '@/lib/metadata';
import { getAllPostSlugs, getPostBySlug, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, SUPPORTED_LOCALES } from '@/lib/i18n';

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of SUPPORTED_LOCALES) {
    const slugs = await getAllPostSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

type PostPageProps = {
  params: { locale: string; slug: string };
};

export default async function PostPage({ params }: PostPageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }
  const locale = params.locale as Locale;
  const post = await getPostBySlug(locale, params.slug);
  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <LanguageSwitcher locale={locale} localizedSlugs={post.localizedSlugs} currentSlug={post.slug} />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{post.excerpt}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>
        {post.publishedAt ? (
          <time dateTime={post.publishedAt} className="text-xs uppercase tracking-wider text-muted-foreground">
            {new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(post.publishedAt))}
          </time>
        ) : null}
      </header>
      <div className="space-y-4 text-base leading-relaxed">{renderMarkdoc(post.content)}</div>
    </article>
  );
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) {
    return {};
  }
  const locale = params.locale as Locale;
  const [site, post] = await Promise.all([getSite(locale), getPostBySlug(locale, params.slug)]);
  if (!post) {
    return {};
  }
  return buildPageMetadata({
    locale,
    slug: `posts/${post.slug}`,
    siteSeo: site.seo,
    pageSeo: post.seo,
    localizedSlugs: Object.fromEntries(
      Object.entries(post.localizedSlugs ?? {}).map(([key, value]) => [key, value ? `posts/${value}` : value])
    ) as Partial<Record<Locale, string>>,
  });
}