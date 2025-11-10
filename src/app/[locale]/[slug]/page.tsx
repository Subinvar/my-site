import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getAllPages, getPageAlternates, getPageBySlug, getSite } from '@/lib/keystatic';
import { isLocale, locales, type Locale } from '@/lib/i18n';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function resolveAlternates(slugByLocale: Partial<Record<Locale, string>>) {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const slug = slugByLocale[locale];
    if (slug === undefined) {
      continue;
    }
    languages[locale] = buildPath(locale, slug ? [slug] : []);
  }
  return { languages };
}

function resolveOpenGraph({
  locale,
  slug,
  title,
  description,
  ogImage,
}: {
  locale: Locale;
  slug: string;
  title?: string | null;
  description?: string | null;
  ogImage?: { src: string; alt?: string | null } | null;
}): Metadata['openGraph'] {
  const url = buildPath(locale, slug ? [slug] : []);
  return {
    type: 'website',
    locale,
    url,
    title: title ?? undefined,
    description: description ?? undefined,
    images: ogImage ? [{ url: ogImage.src, alt: ogImage.alt ?? undefined }] : undefined,
  };
}

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
  const alternates = await getPageAlternates(page.id);
  const title = page.seo?.title ?? page.title ?? site.defaultSeo?.title ?? undefined;
  const description = page.seo?.description ?? site.defaultSeo?.description ?? undefined;
  const ogImage = page.seo?.ogImage ?? site.defaultSeo?.ogImage ?? undefined;
  return {
    title,
    description,
    alternates: resolveAlternates(alternates),
    openGraph: resolveOpenGraph({ locale, slug: page.slug, title, description, ogImage }),
  } satisfies Metadata;
}