import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'success' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-[color-mix(in_srgb,var(--color-brand-600)_10%,transparent)] text-[var(--color-brand-600)]',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
};

export function Badge({ variant = 'default', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        variantClasses[variant],
        className,
      )}
      {...rest}
    />
  );
}
