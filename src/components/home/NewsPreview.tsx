import { getAllPosts, getPostBySlug } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';
import { NewsPreviewContent } from './NewsPreviewContent';

type Props = {
  locale: Locale;
  intro?: {
    title?: string;
    description?: string;
  };
};

export type PostPreview = {
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

export async function NewsPreview({ locale, intro }: Props) {
  const posts = await getLatestPosts(locale);

  const withFallback = (value: string | undefined, fallback: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : fallback;
  };

  const title = withFallback(intro?.title, SECTION_TITLE[locale]);
  const description = withFallback(intro?.description, SECTION_DESCRIPTION[locale]);

  if (posts.length === 0) {
    return null;
  }

  return (
    <NewsPreviewContent
      locale={locale}
      title={title}
      description={description}
      viewAllLabel={VIEW_ALL_LABEL[locale]}
      viewPostLabel={VIEW_POST_LABEL[locale]}
      posts={posts}
      viewAllHref={buildPath(locale, ['news'])}
    />
  );
}
