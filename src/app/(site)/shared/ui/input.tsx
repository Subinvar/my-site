import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const base =
  'block w-full rounded-lg border border-[var(--header-border)] bg-[var(--background)] px-3 py-2 text-sm ' +
  'transition-colors transition-shadow transition-transform duration-150 ' +
  'placeholder:text-[var(--muted-foreground)] ' +
  'focus-visible:outline-none focus-visible:border-[var(--foreground)] ' +
  'focus-visible:ring-0 focus-visible:ring-offset-0 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(base, className)}
      aria-invalid={Boolean(error) || undefined}
    />
  );
}
