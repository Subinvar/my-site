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

  // Локальное состояние для анимации «поезда» с вагонами
  const [activeLocale, setActiveLocale] = useState<Locale>(currentLocale);

  // Синхронизация на случай внешней смены currentLocale
  useEffect(() => {
    setActiveLocale(currentLocale);
  }, [currentLocale]);

  const isRuActive = activeLocale === 'ru';

  // Капсула — те же габариты, что у ThemeToggle (w-10)
  const baseClasses =
    'relative overflow-hidden rounded-full border border-border shadow-sm no-underline w-10 bg-transparent';

  // Пояс с двумя вагонами: ширина 200% от окна (каждый вагон = 50%)
  // Фокус: чуть сдвигаем пояс внутрь (на 1px), чтобы буквы не упирались в радиусы.
  const trackClassName = cn(
    'flex h-full w-[200%]',
    'transition-transform duration-200 ease-out',
    isRuActive
      ? 'translate-x-[1px]'
      : 'translate-x-[calc(-50%+1px)]',
  );

  // Один вагон (RU или EN)
  const wagonClassName =
    'flex w-1/2 items-center justify-center text-[11px] font-medium uppercase tracking-[0.08em] text-foreground';

  // Внутреннее содержимое: окно полностью повторяет размеры кнопки
  const innerContent = (
    <span className="relative block h-full w-full overflow-hidden">
      <span className={trackClassName}>
        <span className={wagonClassName}>RU</span>
        <span className={wagonClassName}>EN</span>
      </span>
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
    // Локальная анимация поезда перед навигацией
    setActiveLocale(targetLocale);
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
