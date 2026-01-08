'use client';

import { useCallback } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { AppleHoverLift } from '@/app/(site)/shared/ui/apple-hover-lift';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/(site)/shared/ui/card';
import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';

export type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  target?: string;
  rel?: string;
};

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button !== 0;
}

function selectionInside(element: HTMLElement, selection: Selection | null): boolean {
  if (!selection) return false;
  if (selection.isCollapsed) return false;

  const contains = (node: Node | null) => Boolean(node && element.contains(node));

  return contains(selection.anchorNode) || contains(selection.focusNode);
}

export function QuickActionCard({
  title,
  description,
  href,
  icon,
  target,
  rel,
}: QuickActionCardProps) {
  const handleClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    // If user is selecting text inside the card, don't trigger navigation (tel/mailto, etc.).
    const selection = window.getSelection?.() ?? null;
    if (selectionInside(event.currentTarget, selection)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (isModifiedEvent(event) || target) return;

    if (href.startsWith('#')) {
      const anchorId = href.slice(1);
      const anchor = document.getElementById(anchorId);
      if (!anchor) return;

      event.preventDefault();

      if (window.location.hash !== href) {
        window.history.pushState(null, '', href);
      } else {
        window.history.replaceState(null, '', href);
      }

      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      anchor.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }, []);

  return (
    <AppleHoverLift className="h-full">
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={handleClick}
        className={cn('group block h-full rounded-2xl', focusRingBase)}
      >
        <Card
          className={cn(
            'h-full border-[var(--header-border)] bg-background/45 p-4 shadow-none',
            'transition-colors duration-200 ease-out hover:bg-background/60',
          )}
        >
          <CardHeader className="gap-2">
            <div
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-xl',
                'border border-[var(--header-border)] bg-muted/60 text-foreground',
              )}
            >
              {icon}
            </div>
            <CardTitle className="text-sm font-semibold leading-snug">{title}</CardTitle>
            <CardDescription className="break-words select-text text-[var(--muted-foreground)] leading-normal">
              {description}
            </CardDescription>
          </CardHeader>
        </Card>
      </a>
    </AppleHoverLift>
  );
}
