import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { renderMarkdoc } from '@/lib/markdoc';
import { buildPageMetadata } from '@/lib/metadata';
import { getAllPageSlugs, getPageBySlug, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, SUPPORTED_LOCALES } from '@/lib/i18n';

export async function generateStaticParams() {
  const params: { locale: string; static: string[] }[] = [];
  for (const locale of SUPPORTED_LOCALES) {
    const slugs = await getAllPageSlugs(locale);
    for (const slug of slugs) {
      if (!slug) continue;
      params.push({ locale, static: slug.split('/') });
    }
  }
  return params;
}

type StaticPageProps = {
  params: { locale: string; static?: string[] };
};

export default async function StaticPage({ params }: StaticPageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }
  const locale = params.locale as Locale;
  const slugSegments = params.static ?? [];
  const slug = slugSegments.join('/');
  const page = await getPageBySlug(locale, slug);
  if (!page) {
    notFound();
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <LanguageSwitcher locale={locale} localizedSlugs={page.localizedSlugs} currentSlug={page.slug} />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{page.excerpt}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{page.title}</h1>
      </header>
      <div className="space-y-4 text-base leading-relaxed">{renderMarkdoc(page.content)}</div>
    </article>
  );
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) {
    return {};
  }
  const locale = params.locale as Locale;
  const slug = (params.static ?? []).join('/');
  const [site, page] = await Promise.all([getSite(locale), getPageBySlug(locale, slug)]);
  if (!page) {
    return {};
  }
  return buildPageMetadata({
    locale,
    slug: page.slug,
    siteSeo: site.seo,
    pageSeo: page.seo,
    localizedSlugs: page.localizedSlugs,
  });
}