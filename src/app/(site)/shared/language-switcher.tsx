import Link from 'next/link';

import { buttonClassNames } from '@/app/(site)/shared/ui/button-classes';
import type { Locale } from '@/lib/i18n';

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
  const targetHref = href ?? null;
  const isDisabled = targetHref === null;
  const ariaLabelValue = switchToLabels[targetLocale];
  const ariaLabel = ariaLabelValue && ariaLabelValue.trim().length ? ariaLabelValue : undefined;
  const label = currentLocale === 'ru' ? 'EN' : 'RU';

  if (isDisabled) {
    return (
      <span
        className={
          buttonClassNames({
            variant: 'ghost',
            size: 'sm',
            className: 'rounded-full border border-border shadow-sm uppercase tracking-[0.08em] opacity-50',
          })
        }
        aria-label={ariaLabel}
        aria-disabled="true"
        role="link"
      >
        {label}
      </span>
    );
  }

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