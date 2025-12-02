import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductCategoriesSection } from '@/app/(site)/shared/product-categories';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { getHomePage, resolveHomeMetadata } from '@/app/(site)/shared/home-page';
import { switchLocalePath, findTargetLocale, buildPath } from '@/lib/paths';
import { defaultLocale } from '@/lib/i18n';
import { Hero } from '@/components/home/Hero';
import { HomeAbout } from '@/components/home/HomeAbout';
import { HomeStats } from '@/components/home/HomeStats';
import { ProductDirections } from '@/components/home/ProductDirections';
import { PartnersStrip } from '@/components/home/PartnersStrip';
import { NewsPreview } from '@/components/home/NewsPreview';

export const dynamic = 'force-static';

export default async function RootHomePage() {
  const locale = defaultLocale;
  const [data, shell] = await Promise.all([
    getHomePage(locale),
    getSiteShellData(locale),
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
        <Hero locale={locale} />

        <ProductDirections locale={locale} />

        <HomeAbout locale={locale} />

        <HomeStats locale={locale} />

        <NewsPreview locale={locale} />

        <PartnersStrip locale={locale} />

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

export async function generateMetadata(): Promise<Metadata> {
  return resolveHomeMetadata(defaultLocale);
}