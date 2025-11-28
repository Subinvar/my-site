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

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{currentLocale.toUpperCase()}</span>
      <span aria-hidden="true" className="text-zinc-300">
        /
      </span>
      <Link
        href={targetHref}
        className="rounded-full border border-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        aria-label={ariaLabel}
      >
        {targetLocale.toUpperCase()}
      </Link>
    </div>
  );
}