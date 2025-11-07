import { NextResponse } from 'next/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function GET() {
  const content = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${new URL('/sitemap.xml', siteUrl).toString()}`,
  ].join('\n');

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}