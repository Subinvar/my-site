import type { MetadataRoute } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, getSite } from '@/lib/keystatic';
import { isLocale, type Locale, locales, localizePath, toLanguageTag } from '@/lib/i18n';

export const dynamic = 'force-static';
export const revalidate = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function manifest({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}): Promise<MetadataRoute.Manifest> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const [dictionary, site] = await Promise.all([getDictionary(locale), getSite(locale)]);
  const startUrlPath = localizePath(locale, '');
  const startUrl = startUrlPath.endsWith('/') ? startUrlPath : `${startUrlPath}/`;

  return {
    name: site.brand.siteName,
    short_name: site.brand.siteName,
    description: site.defaultSeo?.description ?? dictionary.common.tagline,
    lang: toLanguageTag(locale),
    start_url: startUrl,
    scope: startUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  } satisfies MetadataRoute.Manifest;
}