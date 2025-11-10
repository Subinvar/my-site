import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Markdoc from '@markdoc/markdoc';
import React from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import markdocConfig from '@/lib/markdoc-config';
import { createMarkdocComponents } from '@/lib/markdoc-components';
import { buildPageMetadata } from '@/lib/metadata';
import { getDictionary, getHomePage, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, locales } from '@/lib/i18n';

type LocalePageParams = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHomePage({ params }: LocalePageParams) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const [page, dictionary] = await Promise.all([getHomePage(locale), getDictionary(locale)]);

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

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <LocaleSwitcher locale={locale} entry={{ id: page.id, slugByLocale: page.slugByLocale }} />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{page.excerpt}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{page.title}</h1>
      </header>
      <div className="prose-markdoc">{markdocContent}</div>
    </article>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalePageParams): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale as Locale;
  const [site, page, dictionary] = await Promise.all([getSite(locale), getHomePage(locale), getDictionary(locale)]);
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