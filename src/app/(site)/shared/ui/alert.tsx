import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type AlertVariant = 'success' | 'destructive' | 'brand';

const variantClasses: Record<AlertVariant, string> = {
  // IMPORTANT: these alerts are used in toast notifications on top of the page.
  // Using `transparent` makes them look "washed out". Mix with `--background` instead.
  success:
    'border-[var(--success-border)] bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success-foreground)]',
  destructive:
    'border-[var(--destructive-border)] bg-[color-mix(in_srgb,var(--destructive)_14%,var(--background))] text-[var(--destructive-foreground)]',
  brand:
    'border-[var(--color-brand-200)] bg-[color-mix(in_srgb,var(--color-brand-600)_14%,var(--background))] text-[var(--color-brand-700)] dark:text-[var(--color-brand-50)]',
};

export type AlertProps = {
  variant?: AlertVariant;
  className?: string;
  children: ReactNode;
};

export function Alert({ variant = 'brand', className, children }: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 text-sm animate-fade-in-up',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
