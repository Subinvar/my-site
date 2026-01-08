import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';
import { cardClassNames, type CardPadding, type CardVariant } from './card-classes';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
  /**
   * Card surface styling preset.
   * - default: base card surface
   * - productGroup: product group cards on the "Продукция" page
   * - modal: dialog container surface
   * - panel: neutral panel surface
   */
  variant?: CardVariant;
  /**
   * Card padding preset. If omitted, it is derived from the variant.
   */
  padding?: CardPadding;
}

export function Card({
  as = 'div',
  variant = 'default',
  padding,
  className,
  children,
  ...rest
}: CardProps) {
  const Component = as;
  return (
    <Component
      className={cn(cardClassNames({ variant, padding }), className)}
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
