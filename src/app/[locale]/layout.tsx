import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getNavigation, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, SUPPORTED_LOCALES } from '@/lib/i18n';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale as Locale;

  const [navigation, site] = await Promise.all([getNavigation(locale), getSite(locale)]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      <SiteHeader locale={locale} links={navigation.header.map(({ label, slug }) => ({ label, slug }))} />
      <div className="flex-1">
        {children}
      </div>
      <SiteFooter
        locale={locale}
        links={navigation.footer.map(({ label, slug }) => ({ label, slug }))}
        contacts={site.contacts}
        email={site.email}
      />
    </div>
  );
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) {
    return {};
  }
  const locale = params.locale as Locale;
  const site = await getSite(locale);

  return {
    title: site.seo?.title,
    description: site.seo?.description,
  };
}