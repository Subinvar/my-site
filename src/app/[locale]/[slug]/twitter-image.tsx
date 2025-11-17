import { ImageResponse } from 'next/og';

import { assertKnownLocale } from '@/lib/markdoc';

type OgSeo = {
  title?: string | null;
  description?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
} | null;

type OgEntity = {
  title: string;
  description: string | null;
  seo: OgSeo;
};

type OgSite = {
  name: string | null;
  tagline: string | null;
  domain: string | null;
  description: string | null;
  ogDescription: string | null;
};

type OgResponse = {
  site: OgSite;
  entity: OgEntity | null;
};

export const runtime = 'edge';
export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';

const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 160;

async function fetchOgData(origin: string, locale: string, slug: string): Promise<OgResponse | null> {
  const url = `${origin}/api/og-data?locale=${encodeURIComponent(locale)}&slug=${encodeURIComponent(
    slug
  )}&kind=page`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as OgResponse;
}

const truncate = (value: string | null | undefined, limit: number): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
};

const buildImage = (title: string, description: string | null, brand: string, domain: string | null) => {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background: 'linear-gradient(135deg, #0b0d12 0%, #0f172a 45%, #111827 100%)',
          color: '#f8fafc',
          boxSizing: 'border-box',
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e5e7eb',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 0.4,
            maxWidth: '80%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #38bdf8, #2563eb 60%, #1d4ed8)',
              boxShadow: '0 0 0 3px rgba(59,130,246,0.2)',
            }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.5px',
              textShadow: '0 12px 40px rgba(0,0,0,0.35)',
              maxHeight: 280,
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.35,
                color: '#e2e8f0',
                maxHeight: 140,
                overflow: 'hidden',
                opacity: 0.92,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            color: '#cbd5e1',
            fontSize: 24,
            letterSpacing: 0.2,
            paddingTop: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                boxShadow: '0 8px 28px rgba(37,99,235,0.35)',
              }}
            />
            <span style={{ fontWeight: 600 }}>{brand}</span>
          </div>
          {domain ? (
            <span
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontWeight: 600,
              }}
            >
              {domain}
            </span>
          ) : null}
        </div>
      </div>
    ),
    size
  );
};

export default async function ImageTwitter(
  {
    params,
  }: {
    params: { locale: string; slug: string };
  },
  { request }: { request: Request }
) {
  const { locale: rawLocale, slug } = params;
  assertKnownLocale(rawLocale);
  const locale = rawLocale;

  const origin = new URL(request.url).origin;
  const ogData = await fetchOgData(origin, locale, slug);

  const fallbackTitle = ogData?.site.name ?? 'Intema';
  const fallbackDescription =
    ogData?.site.ogDescription ?? ogData?.site.description ?? ogData?.site.tagline ?? 'Intema Group';
  const brand = fallbackTitle;
  const domain = ogData?.site.domain ?? null;

  if (!ogData?.entity) {
    return buildImage(fallbackTitle, truncate(fallbackDescription, MAX_DESCRIPTION_LENGTH), brand, domain);
  }

  const title =
    truncate(
      ogData.entity.seo?.ogTitle ?? ogData.entity.seo?.title ?? ogData.entity.title ?? fallbackTitle,
      MAX_TITLE_LENGTH
    ) ?? fallbackTitle;

  const description =
    truncate(
      ogData.entity.seo?.ogDescription ??
        ogData.entity.seo?.description ??
        ogData.entity.description ??
        fallbackDescription,
      MAX_DESCRIPTION_LENGTH
    ) ?? fallbackDescription;

  return buildImage(title, description, brand, domain);
}
