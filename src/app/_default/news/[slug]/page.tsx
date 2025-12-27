import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShellLayout } from '@/app/(site)/shared/site-shell-layout';
import { getSiteShellData } from '@/app/(site)/shared/site-shell-data';
import {
  getLocalizedPostParams,
  getPostPage,
  resolvePostPageMetadata,
} from '@/app/(site)/shared/post-page';
import { defaultLocale } from '@/lib/i18n';
import { findTargetLocale, switchLocalePath, buildPath } from '@/lib/paths';

type PostPageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export default async function DefaultLocalePostPage({ params }: PostPageProps) {
  const { slug } = await Promise.resolve(params);
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
  const currentPath = buildPath(locale, ['news', slug]);

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
      <article className="max-w-none">
        <header className="mb-8 space-y-3">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">{post.date}</p>
          <h1 className="text-3xl font-semibold text-foreground">{post.title}</h1>
          {summary ? <p className="text-base text-muted-foreground">{summary}</p> : null}
        </header>
        <div className="prose-markdoc">{content}</div>
        {post.tags.length > 0 ? (
          <ul className="mt-10 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {post.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-border px-3 py-1">
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </SiteShellLayout>
  );
}

export async function generateStaticParams() {
  const params = await getLocalizedPostParams();
  return params
    .filter(({ locale }) => locale === defaultLocale)
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  return resolvePostPageMetadata(defaultLocale, slug);
}