'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

  // Локальное состояние для "вагончиков" RU/EN
  const [animLocale, setAnimLocale] = useState<Locale>(currentLocale);

  useEffect(() => {
    setAnimLocale(currentLocale);
  }, [currentLocale]);

  const isRuActive = animLocale === 'ru';

  // Управляем анимацией hover-бордера:
  // пока isHoverAnimated === false → НЕТ transition-colors,
  // включаем его только после первого real pointerenter.
  const [isHoverAnimated, setIsHoverAnimated] = useState(false);

  const handlePointerEnter = () => {
    if (!isHoverAnimated) {
      setIsHoverAnimated(true);
    }
  };

  // Контейнер:
  // - высота как у бургера/темы (h-10)
  // - border только на hover
  const baseContainerClasses =
    'relative inline-flex h-10 w-10 items-center justify-center ' +
    'rounded-xl border border-transparent ' +
    'bg-background/70 text-[clamp(0.75rem,0.7rem+0.2vw,0.9rem)] font-medium uppercase tracking-[0.08em] text-muted-foreground no-underline select-none ' +
    'hover:border-[var(--header-border)] hover:bg-background/80 hover:text-foreground ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-[var(--background)]';

  const containerClasses = cn(
    baseContainerClasses,
    // До первого pointerenter не анимируем цвет → нет "мигания" на смене страницы
    isHoverAnimated ? 'transition-colors duration-150' : 'transition-none',
    isDisabled && 'cursor-default opacity-50 hover:border-transparent hover:bg-background/70',
  );

  // Вагончики RU / EN
  const wagonBaseClasses =
    'absolute inset-0 flex items-center justify-center px-2 ' +
    'text-[clamp(0.75rem,0.7rem+0.2vw,0.9rem)] font-medium uppercase tracking-[0.08em] ' +
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

  const handleClick = () => {
    // Даём локальную анимацию "вагончиков"
    setAnimLocale(targetLocale);
  };

  return (
    <Link
      href={targetHref}
      aria-label={ariaLabel}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      className={containerClasses}
    >
      {innerContent}
    </Link>
  );
}
