import Link from 'next/link';

import type { Locale } from '@/lib/i18n';
import { buildPath } from '@/lib/paths';

type LanguageSwitcherProps = {
  currentLocale: Locale;
  targetLocale: Locale;
  href: string | null;
  switchToLabels: Record<Locale, string>;
};

export function LanguageSwitcher({
  currentLocale,
  targetLocale,
  href,
  switchToLabels,
}: LanguageSwitcherProps) {
  const targetHref = href ?? buildPath(targetLocale);
  const ariaLabelValue = switchToLabels[targetLocale];
  const ariaLabel = ariaLabelValue && ariaLabelValue.trim().length ? ariaLabelValue : undefined;
  const label = currentLocale === 'ru' ? 'EN' : 'RU';

  return (
    <Link
      href={targetHref}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold uppercase tracking-[0.08em] text-foreground shadow-sm transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={ariaLabel}
    >
      {label}
    </Link>
  );
}