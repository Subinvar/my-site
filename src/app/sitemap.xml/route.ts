import { NextResponse } from 'next/server';

import { getAllPages, getAllPosts, getSite } from '@/lib/keystatic';
import { buildPath } from '@/lib/paths';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';

const XML_HEADER = `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`;

const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

type Collection = 'pages' | 'posts';

type DatedEntry = {
  collection: Collection;
  slugByLocale: Partial<Record<Locale, string | null | undefined>>;
  updatedAt?: string | null;
  date?: string | null;
};

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  alternates: Partial<Record<Locale, string>>;
};

const buildSegments = (collection: Collection, slug: string): string[] => {
  if (collection === 'posts') {
    return ['posts', slug];
  }
  return slug.length ? [slug] : [];
};

const toAbsoluteUrl = (baseUrl: string | null, path: string): string => {
  if (!baseUrl) {
    return path;
  }
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
};

const buildLocalizedUrls = (
  baseUrl: string | null,
  { collection, slugByLocale }: Pick<DatedEntry, 'collection' | 'slugByLocale'>
): Partial<Record<Locale, string>> => {
  const record: Partial<Record<Locale, string>> = {};
  for (const locale of locales) {
    const raw = slugByLocale[locale];
    if (raw === undefined || raw === null) {
      continue;
    }
    const normalized = raw.trim();
    if (collection === 'posts' && normalized.length === 0) {
      continue;
    }
    const segments = buildSegments(collection, normalized);
    const relative = buildPath(locale, segments);
    record[locale] = toAbsoluteUrl(baseUrl, relative);
  }

  return record;
};

const toLastModified = (entry: DatedEntry): string | undefined => {
  const source = entry.updatedAt ?? entry.date;
  if (!source) {
    return undefined;
  }
  const timestamp = Date.parse(source);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }
  return new Date(timestamp).toISOString();
};

const createSitemapUrls = (baseUrl: string | null, entry: DatedEntry): SitemapUrl[] => {
  const urls = buildLocalizedUrls(baseUrl, entry);
  const lastmod = toLastModified(entry);
  const sitemapUrls: SitemapUrl[] = [];

  for (const locale of locales) {
    const loc = urls[locale];
    if (!loc) {
      continue;
    }
    sitemapUrls.push({
      loc,
      lastmod,
      alternates: urls,
    });
  }

  return sitemapUrls;
};

const renderUrlElement = ({ loc, lastmod, alternates }: SitemapUrl): string => {
  const alternateLinks = locales
    .map((locale) => {
      const href = alternates[locale];
      if (!href) {
        return '';
      }
      return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`;
    })
    .filter(Boolean)
    .join('\n');

  const lastmodLine = lastmod ? `    <lastmod>${lastmod}</lastmod>` : '';

  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmodLine,
    alternateLinks,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
};

const renderXml = (records: SitemapUrl[]): string => {
  const urls = records.map(renderUrlElement).join('\n');
  return [
    XML_HEADER,
    `<urlset xmlns="${SITEMAP_NAMESPACE}" xmlns:xhtml="${XHTML_NAMESPACE}">`,
    urls,
    '</urlset>',
  ]
    .filter(Boolean)
    .join('\n');
};

export async function GET() {
  const [site, pages, posts] = await Promise.all([
    getSite(defaultLocale),
    getAllPages(),
    getAllPosts(),
  ]);

  const baseUrl = site.seo.canonicalBase ?? null;

  const pageUrls = pages
    .filter((page) => page.published)
    .flatMap((page) =>
      createSitemapUrls(baseUrl, {
        collection: 'pages',
        slugByLocale: page.slugByLocale,
        updatedAt: page.updatedAt,
      })
    );

  const postUrls = posts
    .filter((post) => post.published)
    .flatMap((post) =>
      createSitemapUrls(baseUrl, {
        collection: 'posts',
        slugByLocale: post.slugByLocale,
        updatedAt: post.updatedAt,
        date: post.date,
      })
    );

  const xml = renderXml([...pageUrls, ...postUrls]);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
    },
  });
}