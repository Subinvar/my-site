import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import {
  getDefaultLocalePostSlugs,
  getPostPage,
  resolvePostPageMetadata,
} from '@/app/(site)/shared/post-page';
import { findTargetLocale, switchLocalePath } from '@/lib/paths';
import { defaultLocale } from '@/lib/i18n';

export const dynamic = 'force-static';

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DefaultPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const locale = defaultLocale;

  const [data, shell] = await Promise.all([
    getPostPage(locale, slug),
    getSiteShellData(locale),
  ]);

  if (!data) {
    notFound();
  }

  const { post, content, summary } = data;
  const targetLocale = findTargetLocale(locale);
  const switcherHref = switchLocalePath(locale, targetLocale, {
    collection: 'posts',
    slugs: post.slugByLocale,
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
        <header className="mb-8 space-y-3">
          <p className="text-sm uppercase tracking-wide text-zinc-500">{post.date}</p>
          <h1 className="text-3xl font-semibold text-zinc-900">{post.title}</h1>
          {summary ? <p className="text-base text-zinc-600">{summary}</p> : null}
        </header>
        <div className="prose-h2:mt-8 prose-h3:mt-6 prose-p:leading-relaxed">{content}</div>
        {post.tags.length ? (
          <ul className="mt-10 flex flex-wrap gap-2 text-sm text-zinc-500">
            {post.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-zinc-200 px-3 py-1">
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </SiteShell>
  );
}

export async function generateStaticParams() {
  const slugs = await getDefaultLocalePostSlugs(defaultLocale);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  return resolvePostPageMetadata(defaultLocale, slug);
}