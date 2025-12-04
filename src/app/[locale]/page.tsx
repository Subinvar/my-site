import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n';
import {
  getHomePage,
  getHomeStaticLocales,
  resolveHomeMetadata,
} from '@/app/(site)/shared/home-page';
import { ProductCategoriesSection } from '@/app/(site)/shared/product-categories';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, switchLocalePath, buildPath } from '@/lib/paths';
import { Hero } from '@/components/home/Hero';
import { HomeAbout } from '@/components/home/HomeAbout';
import { HomeStats } from '@/components/home/HomeStats';
import { ProductDirections } from '@/components/home/ProductDirections';
import { PartnersStrip } from '@/components/home/PartnersStrip';
import { NewsPreview } from '@/components/home/NewsPreview';
import { getHomeContent } from '@/lib/content/home';
import { KeyClientsStrip } from '@/app/(site)/shared/key-clients-strip';

export const dynamic = 'force-static';

type PageParams = { locale: Locale };

type PageProps = {
  params: Promise<PageParams>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [data, shell, home] = await Promise.all([
    getHomePage(locale),
    getSiteShellData(locale),
    getHomeContent(locale),
  ]);

  if (!data) {
    notFound();
  }

  const { page, content, summary } = data;
  const targetLocale = findTargetLocale(locale);
  const switcherHref = switchLocalePath(locale, targetLocale, {
    collection: 'pages',
    slugs: page.slugByLocale,
  });
  const currentPath = buildPath(locale);

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
    >
      <div className="space-y-12">
        <Hero locale={locale} data={home?.hero} />

        <ProductDirections locale={locale} items={home?.directions} />

        <HomeAbout locale={locale} data={home?.about} />

        <HomeStats locale={locale} items={home?.stats} />

        <NewsPreview locale={locale} intro={home?.newsIntro} />

        <PartnersStrip locale={locale} intro={home?.partnersIntro} />

        <KeyClientsStrip locale={locale} variant="compact" />

        <article className="space-y-6 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm sm:p-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{page.title}</h1>
            {summary ? <p className="text-lg text-muted-foreground">{summary}</p> : null}
          </header>
          <div className="prose-markdoc">{content}</div>
        </article>

        <ProductCategoriesSection locale={locale} />
      </div>
    </SiteShell>
  );
}

export async function generateStaticParams(): Promise<Array<{ locale: Locale }>> {
  const locales = await getHomeStaticLocales();
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  return resolveHomeMetadata(locale);
}