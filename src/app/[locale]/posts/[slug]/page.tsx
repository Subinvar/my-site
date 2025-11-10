import Markdoc from '@markdoc/markdoc';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import markdocConfig from '@/lib/markdoc-config';
import { createMarkdocComponents } from '@/lib/markdoc-components';
import { buildPageMetadata } from '@/lib/metadata';
import { getAllPostSlugs, getDictionary, getPostBySlug, getSite } from '@/lib/keystatic';
import { formatDate, isLocale, type Locale, locales, localizePath } from '@/lib/i18n';
import { buildBreadcrumbListJsonLd } from '@/lib/json-ld';
import { buildArticleJsonLd } from '@/lib/seo';
import { buildAbsoluteUrl } from '@/lib/site-url';

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    const slugs = await getAllPostSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

type PostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }
  const locale = localeParam as Locale;
  const [post, dictionary, site] = await Promise.all([
    getPostBySlug(locale, slug),
    getDictionary(locale),
    getSite(locale),
  ]);
  if (!post) {
    notFound();
  }

  const markdocComponents = createMarkdocComponents({
    title: dictionary.messages.markdoc.calloutTitle,
    note: dictionary.messages.markdoc.noteLabel,
    info: dictionary.messages.markdoc.infoLabel,
    warning: dictionary.messages.markdoc.warningLabel,
    success: null,
  });

  const markdocContent = (() => {
    if (!post.content) {
      return null;
    }
    const ast = Markdoc.parse(post.content);
    const transformed = Markdoc.transform(ast, markdocConfig);
    return Markdoc.renderers.react(transformed, React, { components: markdocComponents });
  })();

  const formattedDate = formatDate(post.publishedAt, locale, {
    day: '2-digit',
    month: locale === 'ru' ? '2-digit' : 'short',
    year: 'numeric',
  });

  const canonicalPath = localizePath(locale, `posts/${post.slug}`);
  const slugByLocaleWithPrefix = Object.fromEntries(
    Object.entries(post.slugByLocale ?? {}).map(([key, value]) => [key, value ? `posts/${value}` : value])
  ) as Partial<Record<Locale, string>>;
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd({
    locale,
    rootLabel: dictionary.common.breadcrumbs.rootLabel,
    items: [],
    current: {
      name: post.title,
      href: canonicalPath,
    },
  });
  const ogImage = post.seo?.ogImage ?? site.defaultSeo?.ogImage;
  const articleJsonLd = buildArticleJsonLd({
    locale,
    slugByLocale: slugByLocaleWithPrefix,
    headline: post.seo?.title ?? post.title,
    description: post.seo?.description ?? post.excerpt,
    image: ogImage
      ? { url: buildAbsoluteUrl(ogImage.src), alt: ogImage.alt ?? dictionary.seo.ogImageAlt }
      : { url: buildAbsoluteUrl(`/og-${locale}.svg`), alt: dictionary.seo.ogImageAlt },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    siteName: site.brand.siteName,
    authorName: post.author ?? undefined,
  });

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <LocaleSwitcher locale={locale} entry={{ id: post.id, slugByLocale: slugByLocaleWithPrefix }} />
      <JsonLd id={`ld-json-breadcrumb-${post.slugKey}`} data={breadcrumbJsonLd} />
      <JsonLd id={`ld-json-article-${post.slugKey}`} data={articleJsonLd} />
      <Breadcrumbs locale={locale} items={[{ label: post.title }]} dictionary={dictionary.common.breadcrumbs} />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{post.excerpt}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>
        {formattedDate ? (
          <time dateTime={post.publishedAt ?? undefined} className="text-xs uppercase tracking-wider text-muted-foreground">
            {formattedDate}
          </time>
        ) : null}
      </header>
      <div className="prose-markdoc">{markdocContent}</div>
    </article>
  );
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }
  const locale = localeParam as Locale;
  const [site, post, dictionary] = await Promise.all([
    getSite(locale),
    getPostBySlug(locale, slug),
    getDictionary(locale),
  ]);
  if (!post) {
    return {};
  }
  const slugByLocaleWithPrefix = Object.fromEntries(
    Object.entries(post.slugByLocale ?? {}).map(([key, value]) => [key, value ? `posts/${value}` : value])
  ) as Partial<Record<Locale, string>>;
  return buildPageMetadata({
    locale,
    slug: `posts/${post.slug}`,
    siteSeo: site.seo,
    pageSeo: post.seo,
    slugByLocale: slugByLocaleWithPrefix,
    siteName: site.brand.siteName,
    ogImageAlt: dictionary.seo.ogImageAlt,
    twitter: site.twitter,
  });
}