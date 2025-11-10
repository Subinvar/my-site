import { NextResponse } from 'next/server';
import { defaultLocale } from '@/lib/i18n';
import { getSite } from '@/lib/keystatic';
import { getSiteUrl } from '@/lib/site-url';

function resolveDomainOrigin(domain?: string | null): { origin: string; host: string } | null {
  if (!domain) {
    return null;
  }
  const trimmed = domain.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return null;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return { origin: url.origin, host: url.host };
  } catch {
    return null;
  }
}

export async function GET() {
  const site = await getSite(defaultLocale);
  const robots = site.meta?.robots ?? {};
  const shouldIndex = robots.index !== false;
  const shouldFollow = robots.follow !== false;

  const domain = resolveDomainOrigin(site.meta?.domain);
  const fallbackUrl = new URL(getSiteUrl());
  const origin = domain?.origin ?? fallbackUrl.origin;
  const host = domain?.host ?? fallbackUrl.host;

  const lines = [
    'User-agent: *',
    shouldIndex ? 'Allow: /' : 'Disallow: /',
    `Host: ${host}`,
    `Sitemap: ${new URL('/sitemap.xml', origin).toString()}`,
  ];

  const content = lines.join('\n');
  const robotsTag = `${shouldIndex ? 'index' : 'noindex'},${shouldFollow ? 'follow' : 'nofollow'}`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': robotsTag,
    },
  });
}