import type { NextRequest } from 'next/server';

import { resolveManifest } from '@/app/(site)/shared/manifest';
import { isLocale } from '@/lib/i18n';
import type { Awaitable } from '@/lib/types';

export const dynamic = 'force-static';

type ManifestContext = {
  params: Awaitable<{ locale: string }>;
};

export async function GET(_request: NextRequest, context: ManifestContext) {
  const params = await Promise.resolve(context.params);
  const { locale: rawLocale } = params;
  if (!isLocale(rawLocale)) {
    return new Response('Locale not supported', { status: 404 });
  }

  return resolveManifest(rawLocale);
}