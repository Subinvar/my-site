import type { NextRequest } from 'next/server';

import { buildFeedResponse } from '@/lib/feed';
import { isLocale } from '@/lib/i18n';

type FeedContext = {
  params: { locale: string } | Promise<{ locale: string }>;
};

export async function GET(_request: NextRequest, context: FeedContext) {
  const { locale: rawLocale } = await Promise.resolve(context.params);
  if (!isLocale(rawLocale)) {
    return new Response('Locale not supported', { status: 404 });
  }
  return buildFeedResponse(rawLocale);
}