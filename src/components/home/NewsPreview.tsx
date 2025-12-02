import Link from 'next/link';

import { getAllPosts, getPostBySlug } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';

type Props = { locale: Locale };

type PostPreview = {
  id: string;
  title: string;
  excerpt: string | null;
  href: string;
  date: string | null;
};

const SECTION_TITLE: Record<Locale, string> = {
  ru: 'Новости и материалы',
  en: 'News & insights',
};

const SECTION_DESCRIPTION: Record<Locale, string> = {
  ru: 'Свежие новости компании и практические заметки для литейных цехов.',
  en: 'Recent company updates and practical notes for foundry engineers.',
};

const VIEW_ALL_LABEL: Record<Locale, string> = {
  ru: 'Все новости',
  en: 'All news',
};

const VIEW_POST_LABEL: Record<Locale, string> = {
  ru: 'Читать полностью',
  en: 'Read full story',
};

function toTimestamp(value: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDisplayDate(value: string | null, locale: Locale): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const formatter = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
  });
  return formatter.format(parsed);
}

async function getLatestPosts(locale: Locale, limit = 3): Promise<PostPreview[]> {
  const summaries = await getAllPosts();
  const candidates = summaries
    .filter((post) => post.published)
    .map((post) => {
      const slug = post.slugByLocale[locale];
      if (!slug) return null;
      return { slug, summary: post };
    })
    .filter((entry): entry is { slug: string; summary: (typeof summaries)[number] } => Boolean(entry));

  const posts = await Promise.all(
    candidates.map(async ({ slug, summary }) => {
      const post = await getPostBySlug(slug, locale);
      if (!post) return null;
      const href = buildPath(locale, ['news', slug]);
      const date = post.date ?? summary.updatedAt ?? post.updatedAt ?? null;
      const excerpt = post.description ?? post.excerpt ?? null;

      return {
        id: post.id,
        title: post.title,
        excerpt,
        href,
        date,
      } satisfies PostPreview;
    })
  );

  const filtered = posts.filter((post): post is PostPreview => Boolean(post));

  return filtered
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
    .slice(0, limit);
}

export async function NewsPreview({ locale }: Props) {
  const posts = await getLatestPosts(locale);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{SECTION_TITLE[locale]}</h2>
            <p className="text-muted-foreground">{SECTION_DESCRIPTION[locale]}</p>
          </div>
          <Link href={buildPath(locale, ['news'])} className="text-sm font-medium text-primary hover:underline">
            {VIEW_ALL_LABEL[locale]}
          </Link>
        </header>

        <div className="space-y-4">
          {posts.map((post) => {
            const formattedDate = formatDisplayDate(post.date, locale);
            return (
              <article
                key={post.id}
                className="card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:shadow-md transition-shadow duration-200"
              >
                <div>
                  {formattedDate ? (
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{formattedDate}</div>
                  ) : null}
                  <Link href={post.href} className="text-base font-medium hover:text-primary">
                    {post.title}
                  </Link>
                  {post.excerpt ? (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                  ) : null}
                </div>
                <Link href={post.href} className="text-sm font-medium text-primary hover:underline">
                  {VIEW_POST_LABEL[locale]}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
