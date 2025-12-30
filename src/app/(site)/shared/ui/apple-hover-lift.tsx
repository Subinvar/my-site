'use client';

import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type AppleHoverLiftProps = HTMLAttributes<HTMLDivElement> & {
  strength?: 'sm' | 'md';
};

/**
 * Apple-like hover interaction: subtle scale-up without shadows.
 *
 * Notes:
 * - Uses both hover: and group-hover: so it works either standalone or inside a `group` parent.
 * - Adds z-index on hover to prevent the scaled card from being visually clipped by neighbors.
 * - We intentionally DON'T force GPU compositing in the idle state (e.g. via `transform-gpu`),
 *   because it can make text look blurry. We only hint `will-change` during the hover.
 */
export function AppleHoverLift({ className, strength = 'sm', ...props }: AppleHoverLiftProps) {
  const scale =
    strength === 'md'
      ? 'hover:scale-[1.03] group-hover:scale-[1.03]'
      : 'hover:scale-[1.02] group-hover:scale-[1.02]';

  return (
    <div
      className={cn(
        'relative h-full',
        'transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'hover:will-change-transform group-hover:will-change-transform',
        scale,
        'hover:z-20 focus-within:z-20',
        'motion-reduce:transition-none motion-reduce:hover:scale-100',
        className,
      )}
      {...props}
    />
  );
}
