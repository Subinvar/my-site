import Link from 'next/link';

import type React from 'react';

import type { NavigationLink } from '@/lib/keystatic';
import { cn } from '@/lib/cn';

type NavigationListProps = {
  links: NavigationLink[];
  ariaLabel?: string | null;
  currentPath?: string;
  className?: string;
  density?: 'default' | 'compact';
  stableSlots?: Record<string, number>;
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
  stableSlots,
}: NavigationListProps) {
  if (!links.length) {
    return null;
  }

  const normalizedCurrent = normalizePathname(currentPath);
  const label = ariaLabel?.trim() ?? '';
  const resolvedLabel = label.length > 0 ? label : undefined;

  const listClassName =
    density === 'compact'
      ? 'm-0 p-0 list-none flex flex-wrap lg:flex-nowrap items-center gap-6 text-[13px] font-medium leading-tight'
      : 'm-0 p-0 list-none flex flex-wrap lg:flex-nowrap items-center gap-6 text-sm font-medium';

  const densityClass =
    density === 'compact'
      ? 'text-[clamp(0.935rem,0.858rem+0.275vw,1.078rem)] font-medium leading-tight'
      : 'text-[clamp(0.99rem,0.935rem+0.33vw,1.21rem)] font-medium';

  const labelInnerClassName = cn(
    'relative inline-block',
    // линия: 1px, позиция, скругление концов
    'after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:rounded-full',
    // старт: линии нет
    'after:bg-transparent after:origin-left after:scale-x-0',
    // анимация: "рисуем" + плавно меняем цвет
    'after:transition-[transform,background-color] after:duration-200 after:ease-out',
    // hover/focus: линия появляется и по цвету = border (как у Theme/Language toggle)
    'group-hover:after:bg-[var(--border)] group-focus-visible:after:bg-[var(--border)]',
    'group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100',
  );

  const activeLabelInnerClassName = cn(
    labelInnerClassName,
    // активная страница: линия всегда видна и тёмная (в цвет текста пункта)
    'after:scale-x-100 after:bg-current',
    // и не перекрашиваем её в серую на hover/focus
    'group-hover:after:bg-current group-focus-visible:after:bg-current',
  );

  return (
    <nav aria-label={resolvedLabel} className={className}>
      <ul className={listClassName}>
        {links.map((link) => {
          const href = resolveHref(link.href);
          const normalizedHref = normalizePathname(href);
          const isActive =
            !link.isExternal &&
            (normalizedHref === normalizedCurrent ||
              (normalizedHref !== '/' && normalizedCurrent.startsWith(`${normalizedHref}/`)));

          const slotWidth = stableSlots?.[link.id];
          const isStableSlot = typeof slotWidth === 'number';

          const liClassName = cn(isStableSlot && 'flex flex-none');
          const liStyle = isStableSlot ? ({ width: `${slotWidth}px` } as React.CSSProperties) : undefined;

          const linkClassName = cn(
            isStableSlot ? 'flex w-full justify-center' : 'inline-flex',
            'group',
            'items-center gap-1',
            densityClass,
            'no-underline transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          );

          if (link.isExternal) {
            return (
              <li key={link.id} className={liClassName} style={liStyle}>
                <a
                  href={href}
                  target={link.newTab ? '_blank' : undefined}
                  rel={link.newTab ? 'noopener noreferrer' : undefined}
                  className={linkClassName}
                >
                  <span className={isActive ? activeLabelInnerClassName : labelInnerClassName}>
                    {link.label}
                  </span>
                </a>
              </li>
            );
          }

          return (
            <li key={link.id} className={liClassName} style={liStyle}>
              <Link href={href} className={linkClassName} aria-current={isActive ? 'page' : undefined}>
                <span className={isActive ? activeLabelInnerClassName : labelInnerClassName}>
                  {link.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
