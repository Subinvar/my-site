import { getSite } from '@/lib/keystatic';
import { buildPath } from '@/lib/paths';
import { defaultLocale, type Locale } from '@/lib/i18n';

const THEME_COLOR = '#0f172a';
const BACKGROUND_COLOR = '#ffffff';

type WebManifest = {
  id: string;
  name: string;
  short_name: string;
  description?: string | null;
  start_url: string;
  scope: string;
  lang: string;
  display: 'standalone' | 'minimal-ui' | 'browser';
  background_color: string;
  theme_color: string;
  icons: Array<{ src: string; sizes: string; type: string }>; 
};

function buildStartUrl(locale: Locale): string {
  if (locale === defaultLocale) {
    return '/';
  }
  const path = buildPath(locale);
  return path.endsWith('/') ? path : `${path}/`;
}

export async function resolveManifest(locale: Locale): Promise<Response> {
  const site = await getSite(locale);
  const startUrl = buildStartUrl(locale);
  const manifest: WebManifest = {
    id: startUrl,
    name: site.name ?? 'StroyTech',
    short_name: site.name ?? 'StroyTech',
    description: site.tagline ?? site.seo.description ?? undefined,
    start_url: startUrl,
    scope: locale === defaultLocale ? '/' : `${startUrl}`,
    lang: locale,
    display: 'standalone',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600',
    },
  });
}