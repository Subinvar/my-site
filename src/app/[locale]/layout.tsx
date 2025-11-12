import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import localFont from 'next/font/local';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { findTargetLocale, switchLocalePath, type EntityWithLocalizedSlugs } from '@/lib/paths';
import {
  getAllPosts,
  getNavigation,
  getNavigationEntityByPath,
  getSite,
  type NavigationLink,
} from '@/lib/keystatic';
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

const NAVIGATION_LABEL: Record<Locale, string> = {
  ru: 'Главная навигация',
  en: 'Primary navigation',
};

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const normalizePathname = (value: string): string => {
  const [pathWithoutQuery] = value.split('?');
  const [path] = (pathWithoutQuery ?? '').split('#');
  const trimmed = (path ?? '/').replace(/\/+$/, '');
  return trimmed.length ? trimmed : '/';
};

const resolveHref = (href: string): string => {
  const normalized = href.trim();
  return normalized.length ? normalized : '/';
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

function NavigationList({
  links,
  currentPath,
  locale,
}: {
  links: NavigationLink[];
  currentPath: string;
  locale: Locale;
}) {
  if (!links.length) {
    return null;
  }

  const normalizedCurrent = normalizePathname(currentPath);

  return (
    <nav aria-label={NAVIGATION_LABEL[locale]}>
      <ul className="flex flex-wrap items-center gap-4 text-sm font-medium">
        {links.map((link) => {
          const href = resolveHref(link.href);
          const normalizedHref = normalizePathname(href);
          const isActive = !link.isExternal && normalizedHref === normalizedCurrent;
          const className = `inline-flex items-center gap-1 rounded px-2 py-1 text-zinc-700 transition-colors hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
            isActive ? 'text-zinc-900 underline underline-offset-4' : ''
          }`;

          if (link.isExternal) {
            return (
              <li key={link.id}>
                <a
                  href={href}
                  target={link.newTab ? '_blank' : undefined}
                  rel={link.newTab ? 'noopener noreferrer' : undefined}
                  className={className}
                >
                  {link.label}
                </a>
              </li>
            );
          }

          return (
            <li key={link.id}>
              <Link href={href} className={className} aria-current={isActive ? 'page' : undefined}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

async function resolveEntityForPath(locale: Locale, pathname: string): Promise<EntityWithLocalizedSlugs | undefined> {
  const normalized = pathname.split('?')[0]?.split('#')[0] ?? '/';
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) {
    return { collection: 'pages', slugs: { [locale]: '' } };
  }
  const [segmentLocale, ...rest] = parts;
  if (!isLocale(segmentLocale)) {
    return undefined;
  }
  if (!rest.length) {
    return { collection: 'pages', slugs: { [locale]: '' } };
  }
  if (rest[0] === 'posts' && rest[1]) {
    const posts = await getAllPosts();
    const match = posts.find((post) => post.slugByLocale[locale] === rest[1]);
    if (match) {
      return { collection: 'posts', slugs: match.slugByLocale };
    }
  }
  const navigationEntry = await getNavigationEntityByPath(locale, normalized);
  if (navigationEntry) {
    return { collection: 'pages', slugs: navigationEntry.slugByLocale };
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
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const [site, navigation] = await Promise.all([getSite(locale), getNavigation(locale)]);

  const headerList = await Promise.resolve(headers());
  const pathname =
    headerList.get('x-invoke-path') ??
    headerList.get('x-matched-path') ??
    headerList.get('x-next-url') ??
    `/${locale}`;
  const entity = await resolveEntityForPath(locale, pathname);
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
              <NavigationList links={navigation.header} currentPath={pathname} locale={locale} />
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
            <NavigationList links={navigation.footer} currentPath={pathname} locale={locale} />
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