import { NextResponse } from 'next/server';

import sitemap from '../sitemap';

const XML_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

type AlternateLinks = Record<string, string | undefined> | undefined;

const buildAlternateLinks = (alternates: AlternateLinks): string => {
  if (!alternates) {
    return '';
  }

  return Object.entries(alternates)
    .filter(([, href]) => Boolean(href))
    .map(
      ([hrefLang, href]) =>
        `<xhtml:link rel="alternate" hreflang="${hrefLang}" href="${href}" />`
    )
    .join('');
};

const createSitemapXml = async (): Promise<string> => {
  const entries = await sitemap();

  const urls = entries
    .map((entry) => {
      const lastmod =
        entry.lastModified instanceof Date
          ? entry.lastModified.toISOString()
          : entry.lastModified ?? undefined;
      const alternates = buildAlternateLinks(entry.alternates?.languages);

      return [
        '<url>',
        `<loc>${entry.url}</loc>`,
        lastmod ? `<lastmod>${lastmod}</lastmod>` : '',
        alternates,
        '</url>',
      ]
        .filter(Boolean)
        .join('');
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="${XML_NAMESPACE}" xmlns:xhtml="${XHTML_NAMESPACE}">` +
    urls +
    '</urlset>';
};

export async function GET(): Promise<NextResponse> {
  const xml = await createSitemapXml();

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}