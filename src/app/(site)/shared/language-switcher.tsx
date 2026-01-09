'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';

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
  const ariaLabel =
    ariaLabelValue && ariaLabelValue.trim().length ? ariaLabelValue : undefined;

  const [animLocale, setAnimLocale] = useState<Locale>(currentLocale);

  useEffect(() => {
    setAnimLocale(currentLocale);
  }, [currentLocale]);

  const isRuActive = animLocale === 'ru';

  const [isHoverAnimated, setIsHoverAnimated] = useState(false);

  const handlePointerEnter = () => {
    if (!isHoverAnimated) setIsHoverAnimated(true);
  };

  const baseContainerClasses = cn(
    // ✅ Фикс "съеденных 1px": border прозрачный, обводка внутри через after:inset-px.
    'relative z-0 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-transparent bg-transparent',
    "after:pointer-events-none after:absolute after:inset-px after:rounded-[11px] after:border after:border-transparent after:content-['']",
    'after:transition-colors after:duration-150 after:ease-out',
    'text-[length:var(--header-ui-fs)] leading-[var(--header-ui-leading)] font-medium uppercase tracking-[0.08em] text-muted-foreground no-underline select-none',
    'hover:after:border-current hover:bg-transparent hover:text-foreground',
    'focus-visible:after:border-current',
    focusRingBase,
  );

  const containerClasses = cn(
    baseContainerClasses,
    isHoverAnimated ? 'transition-colors duration-150' : 'transition-none',
    isDisabled &&
      'cursor-default opacity-50 hover:after:border-transparent hover:bg-transparent hover:text-muted-foreground',
  );

  const wagonBaseClasses =
    'absolute inset-0 flex items-center justify-center px-2 ' +
    'text-[length:var(--header-ui-fs)] leading-[var(--header-ui-leading)] font-medium uppercase tracking-[0.08em] ' +
    'transition-transform duration-200 ease-out';

  const ruClassName = cn(
    wagonBaseClasses,
    isRuActive ? 'translate-x-0' : '-translate-x-full',
  );

  const enClassName = cn(
    wagonBaseClasses,
    isRuActive ? 'translate-x-full' : 'translate-x-0',
  );

  const innerContent = (
    <span className="relative block h-full w-full overflow-hidden">
      <span className={ruClassName}>RU</span>
      <span className={enClassName}>EN</span>
    </span>
  );

  if (isDisabled) {
    return (
      <span
        className={containerClasses}
        aria-label={ariaLabel}
        aria-disabled="true"
        role="link"
        onPointerEnter={handlePointerEnter}
      >
        {innerContent}
      </span>
    );
  }

  const handleClick = () => setAnimLocale(targetLocale);

  return (
    <Link
      href={targetHref}
      // Сохраняем позицию страницы при смене языка (не скроллим наверх).
      scroll={false}
      aria-label={ariaLabel}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      className={containerClasses}
    >
      {innerContent}
    </Link>
  );
}
