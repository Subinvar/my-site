import Link from 'next/link';

import type { NavigationLink } from '@/lib/keystatic';

type NavigationListProps = {
  links: NavigationLink[];
  ariaLabel?: string | null;
  currentPath?: string;
  className?: string;
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

export function NavigationList({ links, ariaLabel, currentPath = '/', className }: NavigationListProps) {
  if (!links.length) {
    return null;
  }

  const normalizedCurrent = normalizePathname(currentPath);
  const label = ariaLabel?.trim() ?? '';
  const resolvedLabel = label.length > 0 ? label : undefined;

  return (
    <nav aria-label={resolvedLabel} className={className}>
      <ul className="flex flex-wrap items-center gap-4 text-sm font-medium">
        {links.map((link) => {
          const href = resolveHref(link.href);
          const normalizedHref = normalizePathname(href);
          const isActive = !link.isExternal && normalizedHref === normalizedCurrent;
          const className = `
            inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm
            transition-colors
            hover:bg-brand-50 hover:text-brand-700
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600
            ${
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-muted-foreground'
            }
          `;

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
