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
import { getAllPageSlugs, getDictionary, getPageBySlug, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, locales, localizePath } from '@/lib/i18n';
import { buildBreadcrumbListJsonLd } from '@/lib/json-ld';

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    const slugs = await getAllPageSlugs(locale);
    for (const slug of slugs) {
      if (!slug) continue;
      params.push({ locale, slug });
    }
  }
  return params;
}

type StaticPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function StaticPage({ params }: StaticPageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  if (!slug) {
    notFound();
  }

  const locale = localeParam as Locale;
  const [page, dictionary] = await Promise.all([getPageBySlug(locale, slug), getDictionary(locale)]);

  if (!page) {
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
    if (!page.content) {
      return null;
    }
    const ast = Markdoc.parse(page.content);
    const transformed = Markdoc.transform(ast, markdocConfig);
    return Markdoc.renderers.react(transformed, React, { components: markdocComponents });
  })();

  const currentPath = localizePath(locale, page.slug);
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd({
    locale,
    rootLabel: dictionary.common.breadcrumbs.rootLabel,
    items: [],
    current: {
      name: page.title,
      href: currentPath,
    },
  });

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <LocaleSwitcher locale={locale} entry={{ id: page.id, slugByLocale: page.slugByLocale }} />
      <JsonLd id={`ld-json-breadcrumb-${page.slugKey}`} data={breadcrumbJsonLd} />
      <Breadcrumbs locale={locale} items={[{ label: page.title }]} dictionary={dictionary.common.breadcrumbs} />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{page.excerpt}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{page.title}</h1>
      </header>
      <div className="prose-markdoc">{markdocContent}</div>
    </article>
  );
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const locale = localeParam as Locale;
  const [site, page, dictionary] = await Promise.all([
    getSite(locale),
    getPageBySlug(locale, slug),
    getDictionary(locale),
  ]);

  if (!page) {
    return {};
  }

  return buildPageMetadata({
    locale,
    slug: page.slug,
    siteSeo: site.seo,
    pageSeo: page.seo,
    slugByLocale: page.slugByLocale,
    siteName: site.brand.siteName,
    ogImageAlt: dictionary.seo.ogImageAlt,
    twitter: site.twitter,
  });
}