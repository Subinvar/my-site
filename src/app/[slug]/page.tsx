import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import {
  getContentPage,
  getDefaultLocalePageSlugs,
  resolveContentPageMetadata,
} from '@/app/(site)/shared/content-page';
import { findTargetLocale, switchLocalePath } from '@/lib/paths';
import { defaultLocale } from '@/lib/i18n';

export const dynamic = 'force-static';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DefaultContentPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = defaultLocale;

  const [data, shell] = await Promise.all([
    getContentPage(locale, slug),
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

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
    >
      <article className="prose prose-zinc max-w-none dark:prose-invert">
        <header className="mb-10 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{page.title}</h1>
          {summary ? <p className="text-lg text-zinc-600">{summary}</p> : null}
        </header>
        <div className="prose-h2:mt-8 prose-h3:mt-6 prose-p:leading-relaxed">{content}</div>
      </article>
    </SiteShell>
  );
}

export async function generateStaticParams() {
  const slugs = await getDefaultLocalePageSlugs(defaultLocale);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return resolveContentPageMetadata(defaultLocale, slug);
}