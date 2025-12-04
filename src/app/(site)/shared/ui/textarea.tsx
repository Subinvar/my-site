import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const base =
  'block w-full rounded-lg border bg-[var(--input)] px-3 py-2 text-sm ' +
  'transition-colors transition-shadow transition-transform duration-150 ' +
  'placeholder:text-[var(--muted-foreground)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        base,
        'min-h-[120px]',
        error && 'border-[var(--destructive)] shadow-[0_0_0_1px_var(--destructive)]',
        className,
      )}
      aria-invalid={Boolean(error) || undefined}
    />
  );
}
