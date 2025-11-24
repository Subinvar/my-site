import Link from 'next/link';

import { getAllPosts, getPostBySlug } from '@/lib/keystatic';
import { buildPath } from '@/lib/paths';
import type { Locale } from '@/lib/i18n';

type PostListItem = {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  href: string;
};

const READ_MORE_LABEL: Record<Locale, string> = {
  ru: 'Читать далее',
  en: 'Read more',
};

const EMPTY_STATE_LABEL: Record<Locale, string> = {
  ru: 'Здесь появятся новости и материалы, как только они будут опубликованы.',
  en: 'News and materials will appear here once they are published.',
};

function toTimestamp(value: string | null): number {
  if (!value) {
    return 0;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatDisplayDate(value: string | null, locale: Locale): string | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const formatter = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
  });
  return formatter.format(parsed);
}

async function getLocalizedPosts(locale: Locale): Promise<PostListItem[]> {
  const summaries = await getAllPosts();
  const candidates = summaries
    .filter((post) => post.published)
    .map((post) => {
      const slug = post.slugByLocale[locale];
      if (!slug) {
        return null;
      }
      return { slug, summary: post };
    })
    .filter((entry): entry is { slug: string; summary: (typeof summaries)[number] } => Boolean(entry));

  const posts = await Promise.all(
    candidates.map(async ({ slug, summary }) => {
      const post = await getPostBySlug(slug, locale);
      if (!post) {
        return null;
      }
      const description = post.description ?? post.excerpt ?? null;
      const date = post.date ?? summary.updatedAt ?? post.updatedAt ?? null;
      return {
        id: post.id,
        title: post.title,
        description,
        date,
        href: buildPath(locale, ['posts', slug]),
      } satisfies PostListItem;
    })
  );

  const filteredPosts = posts.filter((post): post is PostListItem => Boolean(post));

  return filteredPosts.sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
}

export async function PostsList({ locale }: { locale: Locale }) {
  const posts = await getLocalizedPosts(locale);

  if (posts.length === 0) {
    return (
      <p className="mt-12 rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
        {EMPTY_STATE_LABEL[locale]}
      </p>
    );
  }

  return (
    <section className="mt-12 space-y-4">
      <ul className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => {
          const formattedDate = formatDisplayDate(post.date, locale);
          return (
            <li key={post.id}>
              <Link
                href={post.href}
                className="group block h-full rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4 text-sm text-blue-600">
                  <span className="font-semibold transition group-hover:text-blue-500">{READ_MORE_LABEL[locale]}</span>
                  {formattedDate ? (
                    <time dateTime={post.date ?? undefined} className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {formattedDate}
                    </time>
                  ) : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold leading-tight text-zinc-900">{post.title}</h2>
                {post.description ? <p className="mt-2 text-sm text-zinc-700">{post.description}</p> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
