import { cn } from '@/lib/cn';

export type CardVariant = 'default' | 'productGroup' | 'modal' | 'panel';
export type CardPadding = 'md' | 'lg' | 'none';

const base =
  [
    // Keep cards "flat" (no drop shadows by default).
    // Hover interactions (if needed) should be handled by wrappers (e.g. <AppleHoverLift />)
    // or by explicitly passing classes from the call site.
    'group',
    'border',
    'transition-colors duration-200 ease-out',
  ].join(' ');

const paddingClasses: Record<CardPadding, string> = {
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
  none: 'p-0',
};

const variantClasses: Record<CardVariant, string> = {
  default: [
    'rounded-2xl',
    'border-[var(--border)]',
    'bg-[var(--card)]',
    'text-[var(--card-foreground)]',
  ].join(' '),

  // Product group cards on the "Продукция" hub page.
  productGroup: [
    'rounded-2xl',
    'border-[var(--header-border)]',
    'bg-background/40',
    'text-[var(--card-foreground)]',
    'hover:bg-background/55',
  ].join(' '),

  // Modal content surface (dialog container).
  modal: [
    'rounded-3xl',
    'border-[var(--header-border)]',
    'bg-background',
    'text-foreground',
    'shadow-none',
  ].join(' '),

  // Neutral panel surface (e.g. blocks under the main content).
  panel: [
    'rounded-3xl',
    'border-[var(--header-border)]',
    'bg-muted',
    'text-foreground',
  ].join(' '),
};

const defaultPaddingByVariant: Record<CardVariant, CardPadding> = {
  default: 'md',
  productGroup: 'none',
  modal: 'lg',
  panel: 'lg',
};

export type CardClassNamesOptions = {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
};

export function cardClassNames({
  variant = 'default',
  padding,
  className,
}: CardClassNamesOptions) {
  const resolvedPadding = padding ?? defaultPaddingByVariant[variant];

  return cn(
    base,
    variantClasses[variant],
    paddingClasses[resolvedPadding],
    className,
  );
}
