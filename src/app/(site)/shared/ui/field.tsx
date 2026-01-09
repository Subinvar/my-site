import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  description?: string;
  error?: string;
  reserveErrorSpace?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  required,
  description,
  error,
  reserveErrorSpace = false,
  children,
  className,
}: FieldProps) {
  const shouldRenderError = reserveErrorSpace || Boolean(error);
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

      {shouldRenderError ? (
        <p
          className={cn(
            'text-xs leading-4',
            error ? 'text-[var(--destructive)]' : 'text-transparent'
          )}
          role={error ? 'alert' : undefined}
          aria-hidden={error ? undefined : true}
        >
          {error ?? '\u00A0'}
        </p>
      ) : null}
    </div>
  );
}
