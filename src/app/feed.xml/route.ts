import { buildFeedResponse } from '@/app/[locale]/feed.xml/route';
import { defaultLocale } from '@/lib/i18n';

export const dynamic = 'force-static';

export async function GET() {
  return buildFeedResponse(defaultLocale);
}