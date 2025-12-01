import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isLocale } from '@/lib/i18n';
import {
  getContentPage,
  getLocalizedPageParams,
  resolveContentPageMetadata,
} from '@/app/(site)/shared/content-page';
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
  const targetLocale = findTargetLocale(locale);
  const switcherHref = switchLocalePath(locale, targetLocale, {
    collection: 'pages',
    slugs: page.slugByLocale,
  });
  const currentPath = buildPath(locale, [slug]);

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
    >
      <article className="max-w-none">
        <header className="mb-10 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{page.title}</h1>
          {summary ? <p className="text-lg text-muted-foreground">{summary}</p> : null}
        </header>
        <div className="prose-markdoc">{content}</div>
      </article>
      {isNewsPage ? <PostsList locale={locale} /> : null}
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