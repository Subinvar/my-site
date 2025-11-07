import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { DictionaryProvider } from '@/lib/use-dictionary';
import { getDictionary, getNavigation, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, SUPPORTED_LOCALES } from '@/lib/i18n';
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

  return (
    <DictionaryProvider value={dictionary}>
      <div className="flex min-h-screen flex-col bg-white text-zinc-900">
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
  };
}