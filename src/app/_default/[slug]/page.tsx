import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import {
  getContentPage,
  getLocalizedPageParams,
  resolveContentPageMetadata,
} from '@/app/(site)/shared/content-page';
import { PartnersSuppliersSection } from '@/app/(site)/shared/partners-suppliers-section';
import { KeyClientsStrip } from '@/app/(site)/shared/key-clients-strip';
import { PartnersCta } from '@/app/(site)/shared/partners-cta';
import { PostsList } from '@/app/(site)/shared/posts-list';
import { defaultLocale } from '@/lib/i18n';
import { findTargetLocale, switchLocalePath, buildPath } from '@/lib/paths';

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export default async function DefaultLocaleContentPage({ params }: PageProps) {
  const { slug } = await Promise.resolve(params);
  const locale = defaultLocale;

  const [data, shell] = await Promise.all([
    getContentPage(locale, slug),
    getSiteShellData(locale),
  ]);

  if (!data) {
    notFound();
  }

  const { page, content, summary } = data;
  const isNewsPage = page.id === 'news';
  const isPartnersPage = page.id === 'partners';
  const targetLocale = findTargetLocale(locale);
  const switcherHref = switchLocalePath(locale, targetLocale, {
    collection: 'pages',
    slugs: page.slugByLocale,
  });
  const currentPath = buildPath(locale, [slug]);

  return (
    <SiteShellLayout
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
      currentYear={shell.currentYear}
    >
      <div className="space-y-12">
        <article className="max-w-none space-y-6">
          <header className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{page.title}</h1>
            {summary ? <p className="text-lg text-muted-foreground">{summary}</p> : null}
          </header>
          <div className="prose-markdoc">{content}</div>
        </article>

        {isPartnersPage ? (
          <>
            <PartnersSuppliersSection locale={locale} />
            <KeyClientsStrip locale={locale} variant="full" />
            <PartnersCta locale={locale} />
          </>
        ) : null}
        {isNewsPage ? <PostsList locale={locale} /> : null}
      </div>
    </SiteShellLayout>
  );
}

export async function generateStaticParams() {
  const params = await getLocalizedPageParams();
  return params
    .filter(({ locale }) => locale === defaultLocale)
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  return resolveContentPageMetadata(defaultLocale, slug);
}