import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';
import { LineWrapText } from './line-wrap-text';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
}

export function Card({ as = 'div', className, children, ...rest }: CardProps) {
  const Component = as;
  return (
    <Component
      className={cn(
        'group rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]',
        'shadow-sm transition-transform transition-shadow duration-200 ease-out transform-gpu',
        'hover:-translate-y-0.5 hover:shadow-lg/10',
        'focus-within:-translate-y-0.5 focus-within:shadow-lg/10',
        'p-4 sm:p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 mb-3', className)} {...rest} />;
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold sm:text-lg', className)} {...rest}>
      <LineWrapText>{children}</LineWrapText>
    </h3>
  );
}

export function CardDescription({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-sm text-[var(--muted-foreground)] leading-relaxed',
        className,
      )}
      {...rest}
    >
      <LineWrapText>{children}</LineWrapText>
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
