import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isLocale } from '@/lib/i18n';
import {
  getContentPage,
  getLocalizedPageParams,
  resolveContentPageMetadata,
} from '@/app/(site)/shared/content-page';
import { Breadcrumbs } from '@/app/(site)/shared/ui/breadcrumbs';
import { SectionHeading } from '@/app/(site)/shared/ui/section-heading';
import { ProductCategoriesSection } from '@/app/(site)/shared/product-categories';
import { PartnersSuppliersSection } from '@/app/(site)/shared/partners-suppliers-section';
import { KeyClientsStrip } from '@/app/(site)/shared/key-clients-strip';
import { PartnersCta } from '@/app/(site)/shared/partners-cta';
import { PostsList } from '@/app/(site)/shared/posts-list';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, switchLocalePath, buildPath } from '@/lib/paths';

type PageParams = { locale: string; slug: string };

type PageProps = {
  params: Promise<PageParams>;
};

export default async function Page({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [data, shell] = await Promise.all([
    getContentPage(locale, slug),
    getSiteShellData(locale),
  ]);

  if (!data) {
    notFound();
  }

  const { page, content, summary } = data;
  const isNewsPage = page.id === 'news';
  const isProductsPage = page.id === 'products';
  const isPartnersPage = page.id === 'partners';
  const targetLocale = findTargetLocale(locale);
  const switcherHref = switchLocalePath(locale, targetLocale, {
    collection: 'pages',
    slugs: page.slugByLocale,
  });
  const currentPath = buildPath(locale, [slug]);
  const homeLabel = locale === 'ru' ? 'Главная' : 'Home';

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
        <article className="max-w-none space-y-6">
          <div className="space-y-4">
            <Breadcrumbs
              items={[
                { label: homeLabel, href: buildPath(locale) },
                { label: page.title },
              ]}
            />
            <SectionHeading title={page.title} description={summary ?? undefined} as="h1" />
          </div>
          <div className="prose-markdoc">{content}</div>
        </article>

        {isPartnersPage ? (
          <>
            <PartnersSuppliersSection locale={locale} />
            <KeyClientsStrip locale={locale} variant="full" />
            <PartnersCta locale={locale} />
          </>
        ) : null}
        {isProductsPage ? <ProductCategoriesSection locale={locale} /> : null}
        {isNewsPage ? <PostsList locale={locale} /> : null}
      </div>
    </SiteShell>
  );
}

export async function generateStaticParams() {
  return getLocalizedPageParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  return resolveContentPageMetadata(locale, slug);
}