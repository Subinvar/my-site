import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isLocale, type Locale } from '@/lib/i18n';
import {
  getLocalizedPostParams,
  getPostPage,
  resolvePostPageMetadata,
} from '@/app/(site)/shared/post-page';

type PostPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const { locale: rawLocale, slug } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const data = await getPostPage(locale, slug);
  if (!data) {
    notFound();
  }

  const { post, content, summary } = data;

  return (
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
  );
}

export async function generateStaticParams(): Promise<Array<{ locale: Locale; slug: string }>> {
  return getLocalizedPostParams();
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }
  const locale = rawLocale;
  return resolvePostPageMetadata(locale, slug);
}