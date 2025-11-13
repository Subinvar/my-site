import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isLocale } from '@/lib/i18n';
import {
  getContentPage,
  getLocalizedPageParams,
  resolveContentPageMetadata,
} from '@/app/(site)/shared/content-page';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, switchLocalePath } from '@/lib/paths';

type PageProps = {
  params: { locale: string; slug: string };
};

export default async function Page({ params }: PageProps) {
  const { locale: rawLocale, slug } = params;

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
      <article className="max-w-none">
        <header className="mb-10 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">{page.title}</h1>
          {summary ? <p className="text-lg text-zinc-600">{summary}</p> : null}
        </header>
        <div className="prose-markdoc">{content}</div>
      </article>
    </SiteShell>
  );
}

export async function generateStaticParams() {
  return getLocalizedPageParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  return resolveContentPageMetadata(locale, slug);
}