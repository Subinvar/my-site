import Link from 'next/link';

import type { NavigationLink } from '@/lib/keystatic';

type NavigationListProps = {
  links: NavigationLink[];
  ariaLabel?: string | null;
  currentPath?: string;
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

export function NavigationList({ links, ariaLabel, currentPath = '/' }: NavigationListProps) {
  if (!links.length) {
    return null;
  }

  const normalizedCurrent = normalizePathname(currentPath);
  const label = ariaLabel?.trim() ?? '';
  const resolvedLabel = label.length > 0 ? label : undefined;

  return (
    <nav aria-label={resolvedLabel}>
      <ul className="flex flex-wrap items-center gap-4 text-sm font-medium">
        {links.map((link) => {
          const href = resolveHref(link.href);
          const normalizedHref = normalizePathname(href);
          const isActive = !link.isExternal && normalizedHref === normalizedCurrent;
          const baseClass =
            'inline-flex items-center gap-1 rounded px-2 py-1 text-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600';
          const stateClass = isActive
            ? 'text-brand-600 underline underline-offset-4'
            : 'hover:text-zinc-900';
          const className = `${baseClass} ${stateClass}`;

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
