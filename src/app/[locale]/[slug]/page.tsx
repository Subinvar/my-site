import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getAllPages, getPageBySlug, getSite } from '@/lib/keystatic';
import { buildAlternates, mergeSeo } from '@/lib/seo';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveAlternateOgLocales,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

const buildSlugMap = (slugByLocale: Partial<Record<Locale, string>>): Partial<Record<Locale, string>> => {
  const record: Partial<Record<Locale, string>> = {};
  for (const candidate of locales) {
    const slug = slugByLocale[candidate];
    if (slug === undefined) {
      continue;
    }
    const segments = slug ? [slug] : [];
    record[candidate] = buildPath(candidate, segments);
  }
  return record;
};

export default async function Page({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const page = await getPageBySlug(slug, locale);
  if (!page) {
    notFound();
  }

  const content = await render(page.content, locale);
  const summary = page.description ?? page.excerpt;

  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert">
      <header className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{page.title}</h1>
        {summary ? <p className="text-lg text-zinc-600">{summary}</p> : null}
      </header>
      <div className="prose-h2:mt-8 prose-h3:mt-6 prose-p:leading-relaxed">{content}</div>
    </article>
  );
}

export async function generateStaticParams() {
  const pages = await getAllPages();
  const params: { locale: Locale; slug: string }[] = [];
  for (const page of pages) {
    if (!page.published) {
      continue;
    }
    for (const locale of locales) {
      const slug = page.slugByLocale[locale];
      if (!slug) {
        continue;
      }
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  const [site, page] = await Promise.all([getSite(locale), getPageBySlug(slug, locale)]);
  if (!page) {
    return {};
  }
  const slugMap = buildSlugMap(page.slugByLocale);
  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });
  const merged = mergeSeo({
    site: site.seo,
    page: page.seo,
    defaults: {
      title: page.title,
      description: page.description ?? page.excerpt ?? null,
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
  const descriptionFallback = merged.description ?? page.description ?? page.excerpt ?? undefined;
  const ogDescriptionFallback = merged.ogDescription ?? descriptionFallback;
  const ogTitleFallback = merged.ogTitle ?? merged.title ?? page.title;

  return {
    title: merged.title ?? page.title,
    description: descriptionFallback,
    alternates: alternatesData,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      alternateLocale: alternateOgLocales.length ? alternateOgLocales : undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: merged.ogImage ? 'summary_large_image' : 'summary',
      site: merged.twitterHandle,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
      images: ogImage ? [ogImage.url] : undefined,
    },
  } satisfies Metadata;
}