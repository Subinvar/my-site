import type { NextRequest } from 'next/server';

import { resolveManifest } from '@/app/(site)/shared/manifest';
import { isLocale } from '@/lib/i18n';

export const dynamic = 'force-static';

type ManifestContext = {
  params: { locale: string } | Promise<{ locale: string }>;
};

export async function GET(_request: NextRequest, context: ManifestContext) {
  const { locale: rawLocale } = await Promise.resolve(context.params);
  if (!isLocale(rawLocale)) {
    return new Response('Locale not supported', { status: 404 });
  }

  return resolveManifest(rawLocale);
}