'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { buttonClassNames } from '@/app/(site)/shared/ui/button-classes';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/cn';

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

  // Локальное состояние для анимации «вагончиков» на текущей странице
  const [animLocale, setAnimLocale] = useState<Locale>(currentLocale);

  useEffect(() => {
    setAnimLocale(currentLocale);
  }, [currentLocale]);

  const isRuActive = animLocale === 'ru';

  // Капсула — чуть шире (w-11), чтобы буквы не упирались в радиус
  const baseClasses =
    'relative overflow-hidden rounded-full border border-border shadow-sm no-underline w-11 bg-background/70';

  // Базовый класс для каждого вагона:
  // - absolute, чтобы занимать всё окно;
  // - px-2 даёт воздух слева/справа;
  // - текст мелкий, но читаемый.
  const wagonBase =
    'absolute inset-0 flex items-center justify-center px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-foreground transition-transform duration-200 ease-out';

  const ruClassName = cn(
    wagonBase,
    isRuActive ? 'translate-x-0' : '-translate-x-full',
  );

  const enClassName = cn(
    wagonBase,
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
        className={buttonClassNames({
          variant: 'ghost',
          size: 'sm',
          className: cn(
            baseClasses,
            'inline-flex items-center justify-center px-0 py-0 cursor-default opacity-50',
            'bg-background/50 shadow-none',
          ),
        })}
        aria-label={ariaLabel}
        aria-disabled="true"
        role="link"
      >
        {innerContent}
      </span>
    );
  }

  const handleClick = () => {
    // Локально переключаемся, чтобы показать анимацию,
    // параллельно Link уводит на другую локаль.
    setAnimLocale(targetLocale);
  };

  return (
    <Link
      href={targetHref}
      aria-label={ariaLabel}
      onClick={handleClick}
      className={buttonClassNames({
        variant: 'ghost',
        size: 'sm',
        className: cn(
          baseClasses,
          'inline-flex items-center justify-center px-0 py-0',
          'transition-transform duration-150',
          'hover:-translate-y-[1px] active:translate-y-[1px]',
          'hover:bg-background/80 focus-visible:bg-background/80',
        ),
      })}
    >
      {innerContent}
    </Link>
  );
}
