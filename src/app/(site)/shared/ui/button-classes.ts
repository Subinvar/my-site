import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const baseClasses =
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-[var(--background)] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed select-none';

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-brand-600)] text-white ' +
    'hover:bg-[color-mix(in_srgb,var(--color-brand-600)_90%,white_10%)] ' +
    'active:bg-[var(--color-brand-700)]',
  secondary:
    'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] ' +
    'hover:bg-[color-mix(in_srgb,var(--color-brand-600)_6%,var(--card))] ' +
    'active:bg-[color-mix(in_srgb,var(--color-brand-600)_10%,var(--card))]',
  ghost:
    'bg-transparent text-[var(--foreground)] ' +
    'hover:bg-[color-mix(in_srgb,var(--color-brand-600)_8%,transparent)]',
  link:
    'bg-transparent px-0 h-auto text-[var(--color-brand-600)] underline underline-offset-4 ' +
    'hover:text-[color-mix(in_srgb,var(--color-brand-600)_80%,white_20%)]',
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
