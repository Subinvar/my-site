import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { DictionaryProvider } from '@/lib/use-dictionary';
import { getDictionary, getNavigation, getSite } from '@/lib/keystatic';
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

  const logoUrl = buildAbsoluteUrl(`/og-${locale}.svg`);
  const organizationJsonLd = buildOrganizationJsonLd({
    locale,
    name: dictionary.brandName,
    description: site.seo?.description,
    email: site.email,
    phone: site.contacts?.phone,
    address: site.contacts?.address,
    logoUrl,
  });

  const alternateLocales = SUPPORTED_LOCALES.filter((candidate) => candidate !== locale);
  const websiteJsonLd = buildWebsiteJsonLd({
    locale,
    name: dictionary.brandName,
    description: site.seo?.description,
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
          links={navigation.header.map(({ label, slug }) => ({ label, slug }))}
          dictionary={{ brandName: dictionary.brandName, header: dictionary.header }}
        />
        <div className="flex-1">
          {children}
        </div>
        <SiteFooter
          locale={locale}
          links={navigation.footer.map(({ label, slug }) => ({ label, slug }))}
          contacts={site.contacts}
          email={site.email}
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
  const site = await getSite(locale);

  return {
    title: site.seo?.title,
    description: site.seo?.description,
    manifest: localizePath(locale, 'manifest.webmanifest'),
  };
}