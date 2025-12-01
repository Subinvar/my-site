import Link from 'next/link';

import { buttonClassNames } from '@/app/(site)/shared/ui/button-classes';
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
      className={buttonClassNames({
        variant: 'ghost',
        size: 'sm',
        className: 'rounded-full border border-border shadow-sm uppercase tracking-[0.08em]',
      })}
      aria-label={ariaLabel}
    >
      {label}
    </Link>
  );
}
