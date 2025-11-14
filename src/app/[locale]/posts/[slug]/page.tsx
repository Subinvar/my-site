import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/lib/i18n';
import {
  getLocalizedPostParams,
  getPostPage,
  resolvePostPageMetadata,
} from '@/app/(site)/shared/post-page';
import { SiteShell } from '@/app/(site)/shared/site-shell';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import { findTargetLocale, switchLocalePath } from '@/lib/paths';

type PostPageProps = {
  params: { locale: Locale; slug: string } | Promise<{ locale: Locale; slug: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const { locale: rawLocale, slug } = await Promise.resolve(params);

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
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

  const tags = Array.isArray(post.tags) ? post.tags : [];
  const hasTags = tags.length > 0;

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={shell.site}
      navigation={shell.navigation}
      switcherHref={switcherHref}
    >
      <article className="max-w-none">
        <header className="mb-8 space-y-3">
          <p className="text-sm uppercase tracking-wide text-zinc-500">{post.date}</p>
          <h1 className="text-3xl font-semibold text-zinc-900">{post.title}</h1>
          {summary ? <p className="text-base text-zinc-600">{summary}</p> : null}
        </header>
        <div className="prose-markdoc">{content}</div>
        {hasTags ? (
          <ul className="mt-10 flex flex-wrap gap-2 text-sm text-zinc-500">
            {tags.map((tag) => (
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

export async function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  return getLocalizedPostParams();
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await Promise.resolve(params);
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  return resolvePostPageMetadata(locale, slug);
}