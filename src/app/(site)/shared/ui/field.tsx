import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  required,
  description,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={htmlFor}
        className="inline-flex items-baseline gap-1 text-sm font-medium text-[var(--foreground)]"
      >
        <span>{label}</span>
        {required ? (
          <span className="text-[var(--destructive)]" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {description ? (
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      ) : null}

      {children}

      {error ? (
        <p className="text-xs text-[var(--destructive)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
