import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'cta';
export type ButtonSize = 'sm' | 'md' | 'lg';

const baseClasses =
  [
    'inline-flex items-center justify-center rounded-lg font-medium select-none',
    'transition-colors transition-shadow transition-transform duration-200 ease-out',
    focusRingBase,
    'disabled:opacity-60 disabled:cursor-not-allowed',
    'transform-gpu active:translate-y-[1px]',
  ].join(' ');

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    [
      'bg-[color:var(--color-brand-600)] text-white shadow-sm',
      'hover:bg-[color:var(--color-brand-700)] hover:shadow-md',
      'dark:bg-[color:var(--color-brand-600)] dark:hover:bg-[color:var(--color-brand-700)]',
    ].join(' '),
  secondary:
    [
      'border border-[var(--border)] bg-[color:var(--card)] text-[var(--foreground)]',
      'hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-700)]',
      'hover:shadow-sm',
    ].join(' '),
  ghost:
    'bg-transparent text-[var(--foreground)] hover:bg-[color:var(--muted)] hover:text-[var(--foreground)]',
  link: 'p-0 h-auto text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]',
  cta: [
    'relative border border-transparent bg-background/45 text-[var(--header-border)] shadow-none',
    "after:pointer-events-none after:absolute after:inset-px after:rounded-[11px] after:border after:border-current after:content-['']",
    'after:transition-colors after:duration-200 after:ease-out',
    'no-underline hover:no-underline',
    'hover:bg-background/60 hover:text-foreground',
    'focus-visible:after:border-current',
  ].join(' '),
};

export type ButtonClassNamesOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

export function buttonClassNames({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: ButtonClassNamesOptions) {
  return cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    fullWidth && 'w-full',
    className,
  );
}
