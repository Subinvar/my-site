import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getAllPages, getPageById, getSite } from '@/lib/keystatic';
import { buildAlternates, mergeSeo } from '@/lib/seo';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n';

const HOME_PAGE_ID = 'home';

type PageProps = {
  params: Promise<{ locale: Locale }>;
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
    if (slug === undefined) {
      continue;
    }
    const segments = slug ? [slug] : [];
    record[candidate] = buildPath(candidate, segments);
  }
  return record;
};

export default async function HomePage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const page = await getPageById(HOME_PAGE_ID, locale);
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

export async function generateStaticParams(): Promise<Array<{ locale: Locale }>> {
  const pages = await getAllPages();
  const home = pages.find((page) => page.id === HOME_PAGE_ID);
  if (!home || !home.published) {
    return [];
  }
  const params: { locale: Locale }[] = [];
  const seen = new Set<Locale>();
  for (const locale of locales) {
    const slug = home.slugByLocale?.[locale];
    if (slug === undefined || seen.has(locale)) {
      continue;
    }
    seen.add(locale);
    params.push({ locale });
  }
  if (!params.length && home.slugByLocale?.[defaultLocale] !== undefined) {
    params.push({ locale: defaultLocale });
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  const [site, page] = await Promise.all([getSite(locale), getPageById(HOME_PAGE_ID, locale)]);
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
  const ogImageUrl = toAbsoluteUrl(merged.ogImage?.src, site.seo.canonicalBase);
  const descriptionFallback = merged.description ?? page.description ?? page.excerpt ?? undefined;
  const ogDescriptionFallback = merged.ogDescription ?? descriptionFallback;
  const ogTitleFallback = merged.ogTitle ?? merged.title ?? page.title;

  return {
    title: merged.title ?? page.title,
    description: descriptionFallback,
    alternates: alternatesData,
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: preferredUrl,
      title: ogTitleFallback,
      description: ogDescriptionFallback,
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