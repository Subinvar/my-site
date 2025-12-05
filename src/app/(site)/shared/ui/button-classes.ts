import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const baseClasses =
  [
    'inline-flex items-center justify-center rounded-xl font-medium select-none',
    'transition-colors transition-shadow transition-transform duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-[var(--background)]',
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
      'bg-[var(--color-brand-600)] text-white shadow-sm',
      'hover:bg-[var(--color-brand-700)] hover:shadow-md',
      'dark:bg-[var(--color-brand-500)] dark:hover:bg-[var(--color-brand-400)]',
    ].join(' '),
  secondary:
    [
      'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]',
      'hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-700)]',
      'hover:shadow-sm',
    ].join(' '),
  ghost:
    'bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
  link: 'p-0 h-auto text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] underline-offset-4 hover:underline',
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
