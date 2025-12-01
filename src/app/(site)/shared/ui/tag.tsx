import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Tag({ active, className, children, ...rest }: TagProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs',
        'transition-colors',
        active
          ? 'border-[var(--color-brand-600)] bg-[color-mix(in_srgb,var(--color-brand-600)_12%,transparent)] text-[var(--foreground)]'
          : 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--card)]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
