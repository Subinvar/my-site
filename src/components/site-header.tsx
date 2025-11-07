import Link from 'next/link';
import type { ReactNode } from 'react';
import { localizePath, type Locale } from '@/lib/i18n';
import type { NavigationLink, UiDictionary } from '@/lib/keystatic';

type HeaderProps = {
  locale: Locale;
  links: NavigationLink[];
  brandName: string;
  dictionary: Pick<UiDictionary, 'header'>;
  languageSwitcher?: ReactNode;
};

export function SiteHeader({ locale, links, brandName, dictionary, languageSwitcher }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href={localizePath(locale, '')}
          className="text-base font-semibold"
          aria-label={dictionary.header.homeAriaLabel}
          title={dictionary.header.homeAriaLabel}
        >
          {brandName}
        </Link>
        <nav aria-label={dictionary.header.navigationAriaLabel} className="flex items-center gap-6">
          {links.map((link) => {
            if (link.kind === 'internal') {
              return (
                <Link
                  key={`${locale}-${link.slug}`}
                  href={localizePath(locale, link.slug)}
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                >
                  {link.label}
                </Link>
              );
            }
            return (
              <a
                key={link.url}
                href={link.url}
                target={link.newTab ? '_blank' : undefined}
                rel={link.newTab ? 'noopener noreferrer' : undefined}
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
              >
                {link.label}
              </a>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">{languageSwitcher ?? null}</div>
      </div>
    </header>
  );
}