import { getAllPosts, getPostBySlug, getSite } from '@/lib/keystatic';
import { type Locale } from '@/lib/i18n';
import { renderToHtml } from '@/lib/markdoc-html';
import type { MarkdocContent } from '@/lib/markdoc';
import { resolveSiteOrigin } from '@/lib/origin';
import { buildPath } from '@/lib/paths';

type FeedEntry = {
  title: string;
  url: string;
  excerpt: string | null;
  content: MarkdocContent;
  publishedAt: string | null;
  updatedAt: string | null;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderContentToHtml(content: MarkdocContent, locale: Locale): string | null {
  return renderToHtml(content, locale);
}

function toAtomEntry({
  title,
  url,
  excerpt,
  content,
  publishedAt,
  updatedAt,
}: FeedEntry): string {
  const effectiveUpdated = updatedAt ?? publishedAt ?? new Date().toISOString();
  const parts = [
    '<entry>',
    `<id>${escapeXml(url)}</id>`,
    `<title>${escapeXml(title)}</title>`,
    `<link href="${escapeXml(url)}" />`,
  ];
  if (publishedAt) {
    parts.push(`<published>${publishedAt}</published>`);
  }
  parts.push(`<updated>${effectiveUpdated}</updated>`);
  if (excerpt) {
    parts.push(`<summary type="html"><![CDATA[${excerpt}]]></summary>`);
  }
  if (content) {
    parts.push(`<content type="html"><![CDATA[${content}]]></content>`);
  }
  parts.push('</entry>');
  return parts.join('\n');
}

const ATOM_XML_HEADER =
  `<?xml version="1.0" encoding="utf-8"?>\n<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>`;

function formatAtomFeed({
  locale,
  siteTitle,
  siteUrl,
  updatedAt,
  entries,
}: {
  locale: Locale;
  siteTitle: string;
  siteUrl: string;
  updatedAt: string;
  entries: string[];
}): string {
  const serializedEntries = entries.map((entry) => `  ${entry}`).join('\n');
  return [
    ATOM_XML_HEADER,
    `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${escapeXml(locale)}">`,
    `  <id>${escapeXml(siteUrl)}</id>`,
    `  <title>${escapeXml(siteTitle)}</title>`,
    `  <updated>${updatedAt}</updated>`,
    `  <link href="${escapeXml(siteUrl)}" rel="self"/>`,
    `  <category term="${escapeXml(locale)}"/>`,
    serializedEntries,
    '</feed>',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function buildFeedResponse(locale: Locale) {
  const [site, postSummaries] = await Promise.all([getSite(locale), getAllPosts()]);
  const origin = resolveSiteOrigin(site.domain);

  const publishedPosts = postSummaries
    .filter((post) => post.published)
    .map((post) => ({ post, slug: post.slugByLocale[locale] }))
    .filter((entry): entry is { post: typeof postSummaries[number]; slug: string } => Boolean(entry.slug));

  const posts = await Promise.all(
    publishedPosts.map(async ({ slug, post }) => {
      const fullPost = await getPostBySlug(slug, locale);
      if (!fullPost) {
        return null;
      }
      return {
        title: fullPost.title,
        url: new URL(buildPath(locale, ['posts', slug]), origin).toString(),
        excerpt: fullPost.excerpt,
        content: fullPost.content,
        publishedAt: fullPost.date ?? post.updatedAt ?? null,
        updatedAt: fullPost.updatedAt ?? fullPost.date ?? null,
      } as FeedEntry;
    })
  );

  const filteredPosts = posts.filter((post): post is FeedEntry => post !== null);
  const sortedPosts = filteredPosts.sort((a, b) => {
    const aDate = a.updatedAt ?? a.publishedAt ?? '';
    const bDate = b.updatedAt ?? b.publishedAt ?? '';
    return bDate.localeCompare(aDate);
  });

  const feedEntries = sortedPosts.map((post) => {
    const content = renderContentToHtml(post.content, locale);
    return toAtomEntry({
      title: post.title,
      url: post.url,
      excerpt: post.excerpt,
      content,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    });
  });

  const latestUpdate = sortedPosts[0]?.updatedAt ?? sortedPosts[0]?.publishedAt ?? new Date().toISOString();
  const feedUrl = new URL(buildPath(locale, ['feed.xml']), origin).toString();
  const siteTitle = site.name?.trim() ?? '';
  const body = formatAtomFeed({
    locale,
    siteTitle,
    siteUrl: feedUrl,
    updatedAt: latestUpdate,
    entries: feedEntries,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600',
    },
  });
}
