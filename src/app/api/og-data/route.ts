import { NextResponse } from 'next/server';

import { assertKnownLocale } from '@/lib/markdoc';
import { getPageBySlug, getPostBySlug, getSite } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get('locale');
  const slug = searchParams.get('slug');
  const kind = searchParams.get('kind') === 'post' ? 'post' : 'page';

  try {
    assertKnownLocale(localeParam ?? undefined);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const locale = localeParam as Locale;
  const site = await getSite(locale);

  const sitePayload = {
    name: site.name ?? null,
    tagline: site.tagline ?? null,
    domain: site.domain ?? site.seo.canonicalBase ?? null,
    description: site.seo.description ?? null,
    ogDescription: site.seo.ogDescription ?? null,
  } as const;

  const entity =
    kind === 'post'
      ? await getPostBySlug(slug, locale)
      : await getPageBySlug(slug, locale);

  if (!entity) {
    return NextResponse.json({ site: sitePayload, entity: null }, { status: 404 });
  }

  return NextResponse.json({
    site: sitePayload,
    entity: {
      title: entity.title,
      description: entity.description ?? entity.excerpt ?? null,
      seo: entity.seo ?? null,
    },
  });
}
