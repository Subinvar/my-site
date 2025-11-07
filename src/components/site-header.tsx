import Link from 'next/link';
import type { ReactNode } from 'react';
import { localizePath, type Locale } from '@/lib/i18n';

export type HeaderLink = {
  label: string;
  slug: string;
};

type HeaderProps = {
  locale: Locale;
  links: HeaderLink[];
  languageSwitcher?: ReactNode;
};

export function SiteHeader({ locale, links, languageSwitcher }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href={localizePath(locale, '')} className="text-base font-semibold">
          My Site
        </Link>
        <nav aria-label="Главное меню" className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={`${locale}-${link.slug}`}
              href={localizePath(locale, link.slug)}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">{languageSwitcher ?? null}</div>
      </div>
    </header>
  );
}