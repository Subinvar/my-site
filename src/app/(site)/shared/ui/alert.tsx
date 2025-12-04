import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type AlertVariant = 'success' | 'destructive' | 'brand';

const variantClasses: Record<AlertVariant, string> = {
  success:
    'border-[var(--success-border)] bg-[var(--success-surface)] text-[var(--success-foreground)]',
  destructive:
    'border-[var(--destructive-border)] bg-[var(--destructive-surface)] text-[var(--destructive-foreground)]',
  brand:
    'border-[var(--color-brand-200)] bg-[color-mix(in_srgb,var(--color-brand-600)_12%,transparent)] text-[var(--color-brand-700)] dark:text-[var(--color-brand-50)]',
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
        'rounded-lg border px-4 py-3 text-sm motion-fade-in-up',
        'data-[in-view=true]:motion-fade-in-up',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
