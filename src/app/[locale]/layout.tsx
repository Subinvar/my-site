import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { NavigationList } from './navigation-list';
import { findTargetLocale, switchLocalePath, type EntityWithLocalizedSlugs } from '@/lib/paths';
import { getNavigation, getPageBySlug, getPostBySlug, getSite } from '@/lib/keystatic';
import {
  HREFLANG_CODE,
  OPEN_GRAPH_LOCALE,
  buildAlternates,
  mergeSeo,
  resolveAlternateOgLocales,
  resolveOpenGraphImage,
  resolveRobotsMeta,
} from '@/lib/seo';
import { isLocale, locales, type Locale } from '@/lib/i18n';
import { geistMono, geistSans } from '../fonts';

const brandFont = localFont({
  src: [
    {
      path: '../../../public/fonts/geist/Geist-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/geist/Geist-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  preload: true,
  display: 'swap',
  variable: '--font-brand',
});

const SKIP_LINK_COPY: Record<Locale, string> = {
  ru: 'Пропустить к основному контенту',
  en: 'Skip to main content',
};

type LocaleRouteParams = {
  locale: string;
  [key: string]: string | string[];
};

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<LocaleRouteParams>;
};

function SkipToContentLink({ locale }: { locale: Locale }) {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:not-sr-only focus-visible:rounded focus-visible:bg-blue-600 focus-visible:px-4 focus-visible:py-2 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      {SKIP_LINK_COPY[locale]}
    </a>
  );
}

async function resolveEntityForParams(
  locale: Locale,
  params: Partial<LocaleRouteParams>
): Promise<EntityWithLocalizedSlugs | undefined> {
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[slugParam.length - 1] : slugParam;

  if (typeof slug === 'string' && slug.length > 0) {
    const page = await getPageBySlug(slug, locale);
    if (page) {
      return { collection: 'pages', slugs: page.slugByLocale };
    }

    const post = await getPostBySlug(slug, locale);
    if (post) {
      return { collection: 'posts', slugs: post.slugByLocale };
    }
  }

  if (typeof params.locale === 'string') {
    return { collection: 'pages', slugs: { [locale]: '' } };
  }

  return undefined;
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const locale = rawLocale;
  const site = await getSite(locale);
  const merged = mergeSeo({ site: site.seo });

  const slugMap = locales.reduce<Partial<Record<Locale, string>>>((acc, candidate) => {
    acc[candidate] = `/${candidate}`;
    return acc;
  }, {});

  const alternates = buildAlternates({
    locale,
    slugMap,
    canonicalBase: site.seo.canonicalBase,
  });

  const currentHrefLang = HREFLANG_CODE[locale];
  const pageUrl = alternates.languages[currentHrefLang] ?? alternates.canonical;
  const ogImage = resolveOpenGraphImage(merged.ogImage, site.seo.canonicalBase);
  const alternateOgLocales = resolveAlternateOgLocales(locale, slugMap);

  return {
    title: merged.title,
    description: merged.description,
    alternates,
    robots: resolveRobotsMeta(site.robots),
    openGraph: {
      type: 'website',
      locale: OPEN_GRAPH_LOCALE[locale],
      url: pageUrl,
      title: merged.ogTitle ?? merged.title,
      description: merged.ogDescription ?? merged.description,
      alternateLocale: alternateOgLocales.length ? alternateOgLocales : undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: merged.ogImage ? 'summary_large_image' : 'summary',
      site: merged.twitterHandle,
      title: merged.ogTitle ?? merged.title,
      description: merged.ogDescription ?? merged.description,
      images: ogImage ? [ogImage.url] : undefined,
    },
  } satisfies Metadata;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const paramsRecord = await params;
  const { locale: rawLocale } = paramsRecord;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [site, navigation] = await Promise.all([getSite(locale), getNavigation(locale)]);

  const entity = await resolveEntityForParams(locale, paramsRecord);
  const targetLocale = findTargetLocale(locale);
  const switcherHref = entity
    ? switchLocalePath(locale, targetLocale, entity)
    : switchLocalePath(locale, targetLocale);

  return (
    <html lang={locale} className={`${brandFont.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-white text-zinc-900 antialiased">
        <SkipToContentLink locale={locale} />
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">{site.name ?? 'StroyTech'}</p>
              <p className="text-lg font-semibold text-zinc-900">{site.tagline}</p>
            </div>
            <div className="flex items-center gap-6">
              <NavigationList links={navigation.header} locale={locale} />
              {switcherHref ? (
                <Link
                  href={switcherHref}
                  className="rounded-full border border-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  {targetLocale.toUpperCase()}
                </Link>
              ) : null}
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
          {children}
        </main>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-zinc-600">
            <NavigationList links={navigation.footer} locale={locale} />
            <div className="flex flex-wrap items-center gap-4">
              {site.contacts.email ? (
                <a
                  className="hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  href={`mailto:${site.contacts.email}`}
                >
                  {site.contacts.email}
                </a>
              ) : null}
              {site.contacts.phone ? (
                <a
                  className="hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  href={`tel:${site.contacts.phone}`}
                >
                  {site.contacts.phone}
                </a>
              ) : null}
              {site.contacts.address ? <span>{site.contacts.address}</span> : null}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}