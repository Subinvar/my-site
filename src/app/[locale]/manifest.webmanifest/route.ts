import { resolveManifest } from '@/app/(site)/shared/manifest';
import { isLocale } from '@/lib/i18n';

export const dynamic = 'force-static';

type ManifestContext = {
  params: { locale: string };
};

export async function GET(_request: Request, context: ManifestContext) {
  const { locale: rawLocale } = context.params;
  if (!isLocale(rawLocale)) {
    return new Response('Locale not supported', { status: 404 });
  }

  return resolveManifest(rawLocale);
}