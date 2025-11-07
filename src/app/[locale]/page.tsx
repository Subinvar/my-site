import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { renderMarkdoc } from '@/lib/markdoc';
import { buildPageMetadata } from '@/lib/metadata';
import { getDictionary, getHomePage, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, SUPPORTED_LOCALES } from '@/lib/i18n';

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> | { locale: string } }) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const [page, dictionary] = await Promise.all([getHomePage(locale), getDictionary(locale)]);

  if (!page) {
    notFound();
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <LanguageSwitcher
        locale={locale}
        localizedSlugs={page.localizedSlugs}
        currentSlug={page.slug}
        dictionary={dictionary.common.languageSwitcher}
      />
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{page.excerpt}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{page.title}</h1>
      </header>
      <div className="space-y-4 text-base leading-relaxed">
        {renderMarkdoc(page.content, { dictionary })}
      </div>
    </article>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> | { locale: string } }): Promise<Metadata> {
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
    localizedSlugs: page.localizedSlugs,
    siteName: site.brand.siteName,
    ogImageAlt: dictionary.seo.ogImageAlt,
    twitter: site.twitter,
  });
}