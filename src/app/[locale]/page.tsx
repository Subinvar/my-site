import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getAllPages, getPageById, getSite } from '@/lib/keystatic';
import { defaultLocale, isLocale, locales, type Locale } from '@/lib/i18n';

const HOME_PAGE_ID = 'home';

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

const OPEN_GRAPH_LOCALE: Record<Locale, string> = { ru: 'ru_RU', en: 'en_US' };

function resolveAlternates(slugByLocale: Partial<Record<Locale, string>>, currentLocale: Locale) {
  const languages: Record<string, string> = {};
  const availableLocales: Locale[] = [];
  for (const candidate of locales) {
    const slug = slugByLocale[candidate];
    if (slug === undefined) {
      continue;
    }
    availableLocales.push(candidate);
    const segments = slug ? [slug] : [];
    languages[candidate] = buildPath(candidate, segments);
  }
  const canonicalSlug = slugByLocale[currentLocale];
  const canonicalSegments = canonicalSlug ? [canonicalSlug] : [];
  return {
    canonical: buildPath(currentLocale, canonicalSegments),
    languages,
    availableLocales,
  };
}

function resolveOpenGraph({
  title,
  description,
  locale,
  slug,
  ogImage,
  availableLocales,
}: {
  title?: string | null;
  description?: string | null;
  locale: Locale;
  slug: string;
  ogImage?: { src: string; alt?: string | null } | null;
  availableLocales: Locale[];
}): Metadata['openGraph'] {
  const url = buildPath(locale, slug ? [slug] : []);
  const alternateLocales = availableLocales
    .filter((candidate) => candidate !== locale)
    .map((candidate) => OPEN_GRAPH_LOCALE[candidate]);
  return {
    title: title ?? undefined,
    description: description ?? undefined,
    url,
    locale: OPEN_GRAPH_LOCALE[locale],
    alternateLocale: alternateLocales.length ? alternateLocales : undefined,
    type: 'website',
    images: ogImage ? [{ url: ogImage.src, alt: ogImage.alt ?? undefined }] : undefined,
  };
}

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

  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert">
      <header className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{page.title}</h1>
        {page.excerpt ? <p className="text-lg text-zinc-600">{page.excerpt}</p> : null}
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
  const { canonical, languages, availableLocales } = resolveAlternates(page.slugByLocale, locale);
  const title = page.seo?.title ?? page.title ?? site.defaultSeo?.title ?? undefined;
  const description = page.seo?.description ?? site.defaultSeo?.description ?? undefined;
  const ogImage = page.seo?.ogImage ?? site.defaultSeo?.ogImage ?? undefined;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: resolveOpenGraph({
      title,
      description,
      locale,
      slug: page.slug,
      ogImage,
      availableLocales,
    }),
  } satisfies Metadata;
}