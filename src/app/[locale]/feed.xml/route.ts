import { NextResponse } from 'next/server';
import { getAllPosts, getDictionary, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, SUPPORTED_LOCALES, localizePath, toLanguageTag } from '@/lib/i18n';
import { buildAbsoluteUrl, getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-static';
export const revalidate = false;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

function escapeXml(value: string | undefined | null): string {
  if (!value) {
    return '';
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(_request: Request, { params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const locale = params.locale as Locale;
  const [site, dictionary, posts] = await Promise.all([
    getSite(locale),
    getDictionary(locale),
    getAllPosts(locale),
  ]);

  const siteUrl = getSiteUrl();
  const languageTag = toLanguageTag(locale);
  const feedUrl = buildAbsoluteUrl(localizePath(locale, 'feed.xml'));
  const title = site.seo?.title ?? dictionary.brandName;
  const description = site.seo?.description ?? dictionary.brandName;

  const sortedPosts = posts
    .filter((post) => Boolean(post.publishedAt))
    .sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    });

  const updated = sortedPosts[0]?.updatedAt ?? sortedPosts[0]?.publishedAt ?? new Date().toISOString();

  const entriesXml = sortedPosts
    .map((post) => {
      const postUrl = buildAbsoluteUrl(localizePath(locale, `posts/${post.slug}`));
      const published = post.publishedAt ?? new Date().toISOString();
      const modified = post.updatedAt ?? post.publishedAt ?? published;
      const summary = post.seo?.description ?? post.excerpt ?? '';

      return `    <entry>\n      <title>${escapeXml(post.seo?.title ?? post.title)}</title>\n      <id>${escapeXml(postUrl)}</id>\n      <link href="${escapeXml(postUrl)}" rel="alternate" type="text/html"/>\n      <published>${published}</published>\n      <updated>${modified}</updated>\n      <summary type="html">${escapeXml(summary)}</summary>\n      <author><name>${escapeXml(dictionary.brandName)}</name><uri>${escapeXml(siteUrl)}</uri></author>\n    </entry>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${escapeXml(languageTag)}">\n  <title>${escapeXml(title)}</title>\n  <id>${escapeXml(feedUrl)}</id>\n  <link href="${escapeXml(feedUrl)}" rel="self" type="application/atom+xml"/>\n  <link href="${escapeXml(siteUrl)}" rel="alternate" type="text/html"/>\n  <updated>${updated}</updated>\n  <subtitle>${escapeXml(description)}</subtitle>\n  <author><name>${escapeXml(dictionary.brandName)}</name><uri>${escapeXml(siteUrl)}</uri></author>\n${entriesXml ? `${entriesXml}\n` : ''}</feed>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/atom+xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}