import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ className, error, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        'block w-full rounded-lg border bg-[var(--input)] text-[var(--foreground)]',
        'border-[var(--border)] px-3 py-2 text-sm sm:text-base',
        'placeholder:text-[var(--muted-foreground)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] ' +
          'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]',
        'disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]',
        error && 'border-[var(--destructive)]',
        className,
      )}
      aria-invalid={!!error}
      {...rest}
    />
  );
}
