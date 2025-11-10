import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { render } from '@/lib/markdoc';
import { buildPath } from '@/lib/paths';
import { getPageById, getSite } from '@/lib/keystatic';
import { isLocale, locales, type Locale } from '@/lib/i18n';

const HOME_PAGE_ID = 'home';

type PageProps = {
  params: Promise<{ locale: string }>;
};

function resolveAlternates(slugByLocale: Partial<Record<Locale, string>>) {
  const languages: Record<string, string> = {};
  for (const candidate of locales) {
    const slug = slugByLocale[candidate];
    if (slug === undefined) {
      continue;
    }
    const segments = slug ? [slug] : [];
    languages[candidate] = buildPath(candidate, segments);
  }
  return { languages };
}

function resolveOpenGraph({
  title,
  description,
  locale,
  slug,
  ogImage,
}: {
  title?: string | null;
  description?: string | null;
  locale: Locale;
  slug: string;
  ogImage?: { src: string; alt?: string | null } | null;
}): Metadata['openGraph'] {
  const url = buildPath(locale, slug ? [slug] : []);
  return {
    title: title ?? undefined,
    description: description ?? undefined,
    url,
    locale,
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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
  const title = page.seo?.title ?? page.title ?? site.defaultSeo?.title ?? undefined;
  const description = page.seo?.description ?? site.defaultSeo?.description ?? undefined;
  const ogImage = page.seo?.ogImage ?? site.defaultSeo?.ogImage ?? undefined;
  return {
    title,
    description,
    alternates: resolveAlternates(page.slugByLocale),
    openGraph: resolveOpenGraph({ title, description, locale, slug: page.slug, ogImage }),
  } satisfies Metadata;
}