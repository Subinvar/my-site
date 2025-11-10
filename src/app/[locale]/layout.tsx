import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { DictionaryProvider } from '@/lib/use-dictionary';
import { getDictionary, getNavigation, getSite } from '@/lib/keystatic';
import { buildPageMetadata } from '@/lib/metadata';
import { isLocale, type Locale, SUPPORTED_LOCALES, localizePath } from '@/lib/i18n';
import { JsonLd } from '@/components/json-ld';
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/json-ld';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;

  const [navigation, site, dictionary] = await Promise.all([
    getNavigation(locale),
    getSite(locale),
    getDictionary(locale),
  ]);

  const logoUrl = site.brand.logo?.src ? buildAbsoluteUrl(site.brand.logo.src) : buildAbsoluteUrl(`/og-${locale}.svg`);
  const organizationJsonLd = buildOrganizationJsonLd({
    locale,
    name: site.brand.companyName || site.brand.siteName,
    description: site.defaultSeo?.description ?? dictionary.common.tagline,
    email: site.brand.contacts.email,
    phone: site.brand.contacts.phone,
    address: site.brand.contacts.address,
    logoUrl,
  });

  const alternateLocales = SUPPORTED_LOCALES.filter((candidate) => candidate !== locale);
  const websiteJsonLd = buildWebsiteJsonLd({
    locale,
    name: site.brand.siteName,
    description: site.defaultSeo?.description,
    alternateLocales,
    searchUrl: null,
  });

  return (
    <DictionaryProvider value={dictionary}>
      <div className="flex min-h-screen flex-col bg-white text-zinc-900">
        <JsonLd id="ld-json-organization" data={organizationJsonLd} />
        <JsonLd id="ld-json-website" data={websiteJsonLd} />
        <SiteHeader
          locale={locale}
          links={navigation.header}
          brandName={site.brand.siteName}
          dictionary={{ header: dictionary.header }}
        />
        <div className="flex-1">
          {children}
        </div>
        <SiteFooter
          locale={locale}
          links={navigation.footer}
          contacts={{ address: site.brand.contacts.address, phone: site.brand.contacts.phone }}
          email={site.brand.contacts.email}
          dictionary={{ footer: dictionary.footer }}
        />
      </div>
    </DictionaryProvider>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> | { locale: string } }): Promise<Metadata> {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale as Locale;
  const [site, dictionary] = await Promise.all([getSite(locale), getDictionary(locale)]);

  const metadata = buildPageMetadata({
    locale,
    slug: '',
    siteSeo: site.seo,
    localizedSlugs: Object.fromEntries(
      SUPPORTED_LOCALES.map((candidate) => [candidate, ''] as const)
    ) as Partial<Record<Locale, string>>,
    siteName: site.brand.siteName,
    ogImageAlt: dictionary.seo.ogImageAlt,
    twitter: site.twitter,
  });

  return {
    ...metadata,
    manifest: localizePath(locale, 'manifest.webmanifest'),
  };
}