import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--foreground)]">
      <input
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border border-[var(--border)] bg-white',
          'text-[var(--color-brand-600)] accent-[var(--color-brand-600)]',
          className,
        )}
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}
