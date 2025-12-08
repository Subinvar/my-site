'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';

import { buttonClassNames } from '@/app/(site)/shared/ui/button-classes';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { usePillFillAnimation } from '@/app/(site)/shared/ui/use-pill-fill-animation';

type LanguageSwitcherProps = {
  currentLocale: Locale;
  targetLocale: Locale;
  href: string | null;
  switchToLabels: Record<Locale, string>;
};

const LANG_SWITCH_FLAG = 'intemaLangSwitchHover';

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

  const label = currentLocale === 'ru' ? 'EN' : 'RU';
  const baseClasses =
    'relative overflow-hidden rounded-full border border-border shadow-sm uppercase tracking-[0.08em] no-underline w-12 bg-transparent';

  const linkRef = useRef<HTMLAnchorElement | null>(null);

  // анимация "пилюли"
  const { isFilled, setIsFilled, fillClassName, handlers } = usePillFillAnimation({
    initialFilled: true, // дальше скорректируем в useLayoutEffect
  });

  // логика sessionStorage/hover-on-mount — сверху
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const node = linkRef.current;
    if (!node) return;

    const hoveredOnMount = node.matches(':hover');
    const fromSwitch =
      window.sessionStorage.getItem(LANG_SWITCH_FLAG) === '1';

    if (fromSwitch) {
      window.sessionStorage.removeItem(LANG_SWITCH_FLAG);
    }

    if (!hoveredOnMount && !fromSwitch) {
      // Стартуем без заливки, но без анимации (hasInteracted всё ещё false)
      setIsFilled(false);
    }
    // Если hoveredOnMount || fromSwitch — оставляем заливку.
  }, [setIsFilled]);

  const markSwitchInSession = () => {
    if (typeof window === 'undefined') return;
    try {
      const node = linkRef.current;
      const hovered = node?.matches(':hover') ?? false;

      if (!hovered) {
        window.sessionStorage.removeItem(LANG_SWITCH_FLAG);
        return;
      }

      window.sessionStorage.setItem(LANG_SWITCH_FLAG, '1');
    } catch {
      // без спец-логики — ок
    }
  };

  if (isDisabled) {
    return (
      <span
        className={buttonClassNames({
          variant: 'ghost',
          size: 'sm',
          className: cn(
            baseClasses,
            'opacity-50 hover:bg-transparent focus-visible:bg-transparent',
          ),
        })}
        aria-label={ariaLabel}
        aria-disabled="true"
        role="link"
      >
        <span className="relative z-10">{label}</span>
      </span>
    );
  }

  return (
    <Link
      href={targetHref}
      ref={linkRef}
      onClick={markSwitchInSession}
      {...handlers}
      className={buttonClassNames({
        variant: 'ghost',
        size: 'sm',
        className: cn(
          baseClasses,
          'group',
          'hover:bg-transparent focus-visible:bg-transparent',
        ),
      })}
      aria-label={ariaLabel}
    >
      <span aria-hidden className={fillClassName} />
      <span className="relative z-10 transition-transform duration-300 ease-out group-hover:-translate-y-[1px] group-active:translate-y-[1px]">
        {label}
      </span>
    </Link>
  );
}
