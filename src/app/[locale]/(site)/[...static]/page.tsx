import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { renderMarkdoc } from '@/lib/markdoc';
import { buildPageMetadata } from '@/lib/metadata';
import { getAllPageSlugs, getDictionary, getPageBySlug, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, SUPPORTED_LOCALES, localizePath } from '@/lib/i18n';
import { buildBreadcrumbListJsonLd } from '@/lib/json-ld';

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
  params: Promise<{ locale: string; static?: string[] }>;
};

export default async function StaticPage({ params }: StaticPageProps) {
  const { locale: localeParam, static: staticSegments } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }
  const locale = localeParam as Locale;
  const slugSegments = staticSegments ?? [];
  const slug = slugSegments.join('/');
  const [page, dictionary] = await Promise.all([getPageBySlug(locale, slug), getDictionary(locale)]);
  if (!page) {
    notFound();
  }

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
      <LanguageSwitcher
        locale={locale}
        localizedSlugs={page.localizedSlugs}
        currentSlug={page.slug}
        dictionary={dictionary.common.languageSwitcher}
      />
      <JsonLd id={`ld-json-breadcrumb-${page.slugKey}`} data={breadcrumbJsonLd} />
      <Breadcrumbs locale={locale} items={[{ label: page.title }]} dictionary={dictionary.common.breadcrumbs} />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{page.excerpt}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{page.title}</h1>
      </header>
      <div className="space-y-4 text-base leading-relaxed">{renderMarkdoc(page.content, { dictionary })}</div>
    </article>
  );
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { locale: localeParam, static: staticSegments } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }
  const locale = localeParam as Locale;
  const slug = (staticSegments ?? []).join('/');
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
    localizedSlugs: page.localizedSlugs,
    siteName: site.brand.siteName,
    ogImageAlt: dictionary.seo.ogImageAlt,
    twitter: site.twitter,
  });
}