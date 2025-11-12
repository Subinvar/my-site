'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { NavigationLink } from '@/lib/keystatic';
import type { Locale } from '@/lib/i18n';

const NAVIGATION_LABEL: Record<Locale, string> = {
  ru: 'Главная навигация',
  en: 'Primary navigation',
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

export function NavigationList({ links, locale }: { links: NavigationLink[]; locale: Locale }) {
  const pathname = usePathname();

  if (!links.length) {
    return null;
  }

  const normalizedCurrent = normalizePathname(pathname ?? '/');

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