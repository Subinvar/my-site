import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { as = 'div', className, children, ...rest },
  ref,
) {
  const Component = as;

  return (
    <Component
      // NOTE: `as` can render a non-<div> element (article/section).
      // For our current use-cases we only need ref support for the default <div>.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={cn(
        'group rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]',
        // Flat cards: no drop shadows.
        // Hover interactions (if needed) should be handled by wrappers (e.g. <AppleHoverLift />)
        // or by explicitly passing classes from the call site.
        'transition-colors duration-200 ease-out',
        'p-4 sm:p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 mb-3', className)} {...rest} />;
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('m-0 text-base font-semibold sm:text-lg', className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'm-0 text-sm text-[var(--muted-foreground)] leading-relaxed',
        className,
      )}
      {...rest}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-3 text-[var(--card-foreground)]', className)}
      {...rest}
    />
  );
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4 flex items-center justify-between gap-2', className)} {...rest} />;
}
