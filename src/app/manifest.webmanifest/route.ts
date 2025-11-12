import { resolveManifest } from '@/app/(site)/shared/manifest';
import { defaultLocale } from '@/lib/i18n';

export const dynamic = 'force-static';

export async function GET() {
  return resolveManifest(defaultLocale);
}