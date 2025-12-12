import Link from 'next/link';

import type { NavigationLink } from '@/lib/keystatic';

type NavigationListProps = {
  links: NavigationLink[];
  ariaLabel?: string | null;
  currentPath?: string;
  className?: string;
  density?: 'default' | 'compact';
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

export function NavigationList({
  links,
  ariaLabel,
  currentPath = '/',
  className,
  density = 'default',
}: NavigationListProps) {
  if (!links.length) {
    return null;
  }

  const normalizedCurrent = normalizePathname(currentPath);
  const label = ariaLabel?.trim() ?? '';
  const resolvedLabel = label.length > 0 ? label : undefined;

  const listClassName =
    density === 'compact'
      ? 'm-0 p-0 list-none flex flex-wrap lg:flex-nowrap items-center gap-3 text-[13px] font-medium leading-tight'
      : 'm-0 p-0 list-none flex flex-wrap lg:flex-nowrap items-center gap-4 text-sm font-medium';

  return (
    <nav aria-label={resolvedLabel} className={className}>
      <ul className={listClassName}>
        {links.map((link) => {
          const href = resolveHref(link.href);
          const normalizedHref = normalizePathname(href);
          const isActive = !link.isExternal && normalizedHref === normalizedCurrent;

          const densityClass =
            density === 'compact'
              ? 'text-[clamp(0.85rem,0.78rem+0.25vw,0.98rem)] font-medium leading-tight'
              : 'text-[clamp(0.9rem,0.85rem+0.3vw,1.1rem)] font-medium';

          const linkClassName = `
            inline-flex items-center gap-1 ${densityClass}
            no-underline
            transition-colors
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600
            ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
          `;

          if (link.isExternal) {
            return (
              <li key={link.id}>
                <a
                  href={href}
                  target={link.newTab ? '_blank' : undefined}
                  rel={link.newTab ? 'noopener noreferrer' : undefined}
                  className={linkClassName}
                >
                  {link.label}
                </a>
              </li>
            );
          }

          return (
            <li key={link.id}>
              <Link href={href} className={linkClassName} aria-current={isActive ? 'page' : undefined}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
