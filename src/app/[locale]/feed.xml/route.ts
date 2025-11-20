import type { NextRequest } from 'next/server';

import { buildFeedResponse } from '@/lib/feed';
import { isLocale } from '@/lib/i18n';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return new Response('Locale not supported', { status: 404 });
  }
  return buildFeedResponse(rawLocale);
}