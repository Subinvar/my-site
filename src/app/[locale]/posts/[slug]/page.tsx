import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { renderMarkdoc } from '@/lib/markdoc';
import { buildPageMetadata } from '@/lib/metadata';
import { getAllPostSlugs, getDictionary, getPostBySlug, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, SUPPORTED_LOCALES, localizePath } from '@/lib/i18n';
import { buildArticleJsonLd, buildBreadcrumbListJsonLd } from '@/lib/json-ld';
import { buildAbsoluteUrl } from '@/lib/site-url';

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
  const [post, dictionary] = await Promise.all([
    getPostBySlug(locale, params.slug),
    getDictionary(locale),
  ]);
  if (!post) {
    notFound();
  }

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
        day: locale === 'ru' ? '2-digit' : 'numeric',
        month: locale === 'ru' ? '2-digit' : 'short',
        year: 'numeric',
      }).format(new Date(post.publishedAt))
    : null;

  const canonicalPath = localizePath(locale, `posts/${post.slug}`);
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd({
    locale,
    rootLabel: dictionary.breadcrumbs.rootLabel,
    items: [],
    current: {
      name: post.title,
      href: canonicalPath,
    },
  });
  const articleJsonLd = buildArticleJsonLd({
    locale,
    headline: post.seo?.title ?? post.title,
    description: post.seo?.description ?? post.excerpt,
    url: buildAbsoluteUrl(canonicalPath),
    imageUrl: buildAbsoluteUrl(`/og-${locale}.svg`),
    imageAlt: dictionary.seo.ogImageAlt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    publisherName: dictionary.brandName,
  });

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <LanguageSwitcher
        locale={locale}
        localizedSlugs={post.localizedSlugs}
        currentSlug={post.slug}
        dictionary={{ languageSwitcher: dictionary.languageSwitcher }}
      />
      <JsonLd id={`ld-json-breadcrumb-${post.slugKey}`} data={breadcrumbJsonLd} />
      <JsonLd id={`ld-json-article-${post.slugKey}`} data={articleJsonLd} />
      <Breadcrumbs locale={locale} items={[{ label: post.title }]} dictionary={{ breadcrumbs: dictionary.breadcrumbs }} />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{post.excerpt}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>
        {formattedDate ? (
          <time dateTime={post.publishedAt ?? undefined} className="text-xs uppercase tracking-wider text-muted-foreground">
            {formattedDate}
          </time>
        ) : null}
      </header>
      <div className="space-y-4 text-base leading-relaxed">{renderMarkdoc(post.content, { dictionary })}</div>
    </article>
  );
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) {
    return {};
  }
  const locale = params.locale as Locale;
  const [site, post, dictionary] = await Promise.all([
    getSite(locale),
    getPostBySlug(locale, params.slug),
    getDictionary(locale),
  ]);
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
    siteName: dictionary.brandName,
    ogImageAlt: dictionary.seo.ogImageAlt,
  });
}