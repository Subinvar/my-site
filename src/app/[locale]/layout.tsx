import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findTargetLocale, switchLocalePath, type EntityWithLocalizedSlugs } from '@/lib/paths';
import { getAllPosts, getNavigation, getNavigationEntityByPath, getSite, type NavigationLink } from '@/lib/keystatic';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

function SkipToContentLink() {
  return (
    <a
      href="#main-content"
      className="absolute left-4 top-4 -translate-y-20 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      Перейти к содержимому
    </a>
  );
}

function NavigationList({ links }: { links: NavigationLink[] }) {
  if (!links.length) {
    return null;
  }
  return (
    <nav aria-label="Главное меню">
      <ul className="flex flex-wrap gap-4 text-sm font-medium">
        {links.map((link) => (
          <li key={link.id}>
            {link.isExternal ? (
              <a
                href={link.href}
                target={link.newTab ? '_blank' : undefined}
                rel={link.newTab ? 'noopener noreferrer' : undefined}
                className="text-zinc-700 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-zinc-700 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
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

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;

  const [site, navigation] = await Promise.all([getSite(locale), getNavigation(locale)]);

  const headerList = await Promise.resolve(headers());
  const pathname =
    headerList.get('x-invoke-path') ?? headerList.get('x-matched-path') ?? headerList.get('x-next-url') ?? `/${locale}`;
  const entity = await resolveEntityForPath(locale, pathname);
  const targetLocale = findTargetLocale(locale);
  const switcherHref = entity ? switchLocalePath(locale, targetLocale, entity) : switchLocalePath(locale, targetLocale);

  return (
    <>
      <SkipToContentLink />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">{site.name ?? 'StroyTech'}</p>
            <p className="text-lg font-semibold text-zinc-900">{site.tagline}</p>
          </div>
          <div className="flex items-center gap-6">
            <NavigationList links={navigation.header} />
            {switcherHref ? (
              <Link
                href={switcherHref}
                className="rounded-full border border-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {targetLocale.toUpperCase()}
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-zinc-600">
          <NavigationList links={navigation.footer} />
          <div className="flex flex-wrap items-center gap-4">
            {site.contacts.email ? (
              <a className="hover:text-zinc-900" href={`mailto:${site.contacts.email}`}>
                {site.contacts.email}
              </a>
            ) : null}
            {site.contacts.phone ? (
              <a className="hover:text-zinc-900" href={`tel:${site.contacts.phone}`}>
                {site.contacts.phone}
              </a>
            ) : null}
            {site.contacts.address ? <span>{site.contacts.address}</span> : null}
          </div>
        </div>
      </footer>
    </>
  );
}