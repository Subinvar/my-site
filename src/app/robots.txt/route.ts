import { getSite } from '@/lib/keystatic';
import { defaultLocale } from '@/lib/i18n';
import { resolveRobotsMeta } from '@/lib/seo';
import { resolveSiteOrigin } from '@/lib/origin';

function buildRobotsContent({
  allowIndexing,
  origin,
}: {
  allowIndexing: boolean;
  origin: URL;
}): string {
  const lines = ['User-agent: *'];
  if (allowIndexing) {
    lines.push('Allow: /');
  } else {
    lines.push('Disallow: /');
  }
  lines.push(`Sitemap: ${origin.origin}/sitemap.xml`);
  lines.push(`Host: ${origin.host}`);
  return `${lines.join('\n')}\n`;
}

export async function GET() {
  const site = await getSite(defaultLocale);
  const origin = resolveSiteOrigin(site.domain);
  const robots = resolveRobotsMeta(site.robots);
  const body = buildRobotsContent({ allowIndexing: robots.index, origin });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600',
    },
  });
}