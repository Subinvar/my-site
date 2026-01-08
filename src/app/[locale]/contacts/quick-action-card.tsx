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
            'h-full shadow-none',
          )}
        >
          <CardHeader className="gap-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-[var(--color-brand-600)] dark:text-[var(--color-brand-200)]">
              {icon}
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="break-words select-text text-foreground">
              {description}
            </CardDescription>
          </CardHeader>
        </Card>
      </a>
    </AppleHoverLift>
  );
}
