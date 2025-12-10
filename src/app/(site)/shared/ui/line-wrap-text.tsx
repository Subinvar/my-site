"use client";

import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
  RefObject,
} from 'react';

import { cn } from '@/lib/cn';
import { useLineWrapAnimation } from '@/lib/use-line-wrap-animation';

type Variants = 'subtle' | 'default' | 'emphasized';

type LineWrapTextProps<T extends ElementType> = {
  as?: T;
  variant?: Variants;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function LineWrapText<T extends ElementType = 'span'>({
  as,
  variant = 'default',
  className,
  children,
  ...rest
}: LineWrapTextProps<T>) {
  const Component = (as ?? 'span') as ElementType;
  const ref = useLineWrapAnimation<HTMLElement>({
    animationDurationMs: variant === 'emphasized' ? 200 : 160,
    debounceMs: 90,
  });

  return (
    <Component
      ref={ref as unknown as RefObject<HTMLElement>}
      data-line-wrap-variant={variant}
      className={cn('line-wrap-animated', className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
