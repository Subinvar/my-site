'use client';

import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type AppleHoverLiftProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Strength of the interaction.
   * - xs: ultra subtle
   * - sm: subtle (default)
   * - md: slightly stronger
   */
  strength?: 'xs' | 'sm' | 'md';

  /**
   * How to apply the hover "lift":
   * - scale: scales the wrapper (fast, may blur text on some platforms)
   * - surface: scales only a background surface (keeps text crisp inside scroll containers)
   */
  mode?: 'scale' | 'surface';

  /**
   * Extra classes for the "surface" layer (border, background, rounding, etc.).
   * Only used when mode="surface".
   */
  surfaceClassName?: string;

};

/**
 * Apple-like hover interaction: subtle scale-up without shadows.
 */
export function AppleHoverLift({
  className,
  strength = 'sm',
  mode = 'scale',
  surfaceClassName,
  children,
  ...props
}: AppleHoverLiftProps) {
  // IMPORTANT: keep Tailwind classes static (no template literals),
  // otherwise they won't be picked up by the build.

  const scale =
    strength === 'md'
      ? 'hover:scale-[1.03] focus-within:scale-[1.03] group-hover:scale-[1.03]'
      : strength === 'xs'
        ? 'hover:scale-[1.015] focus-within:scale-[1.015] group-hover:scale-[1.015]'
        : 'hover:scale-[1.02] focus-within:scale-[1.02] group-hover:scale-[1.02]';

  const surfaceScale =
    strength === 'md'
      ? 'group-hover:scale-[1.03] group-focus-within:scale-[1.03]'
      : strength === 'xs'
        ? 'group-hover:scale-[1.015] group-focus-within:scale-[1.015]'
        : 'group-hover:scale-[1.02] group-focus-within:scale-[1.02]';

  // Default "scale" mode: scales the whole wrapper.
  // We intentionally DON'T force GPU compositing in the idle state (e.g. via `transform-gpu`),
  // because it can make text look blurry even without hover.
  if (mode === 'scale') {
    return (
      <div
        className={cn(
          'relative h-full',
          // Helps with transform rendering quality on some platforms.
          // IMPORTANT: avoid forcing GPU compositing / will-change — on Windows/Chrome it often
          // makes text look softer in the hovered state.
          '[backface-visibility:hidden] [transform-style:preserve-3d]',
          'transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          scale,
          'hover:z-20 focus-within:z-20',
          'motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:group-hover:scale-100',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  // "surface" mode: scales only an extra surface layer (bg/border),
  // keeping the content untransformed — this avoids text becoming "blurry" inside
  // horizontal scroll containers on Windows/Chrome.
  return (
    <div
      className={cn('group relative h-full', 'hover:z-20 focus-within:z-20', className)}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0',
          '[backface-visibility:hidden] [transform-style:preserve-3d]',
          'transition-[transform,background-color,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'group-hover:will-change-transform group-focus-within:will-change-transform',
          surfaceScale,
          'group-hover:transform-gpu group-focus-within:transform-gpu',
          'motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-within:scale-100',
          surfaceClassName,
        )}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
