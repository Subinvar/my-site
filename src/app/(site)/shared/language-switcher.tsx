'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { buttonClassNames } from '@/app/(site)/shared/ui/button-classes';
import type { Locale } from '@/lib/i18n';
import { cn } from '@/lib/cn';

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
  const ariaLabel = ariaLabelValue && ariaLabelValue.trim().length ? ariaLabelValue : undefined;

  // Показываем, КУДА переключимся
  const label = currentLocale === 'ru' ? 'EN' : 'RU';

  // Фиксированная ширина, капсула, без подчёркивания
  const baseClasses =
    'relative overflow-hidden rounded-full border border-border shadow-sm uppercase tracking-[0.08em] no-underline w-12 bg-transparent';

  const getInitialFromSwitch = () => {
    if (typeof window === 'undefined') return false;

    try {
      return window.sessionStorage.getItem(LANG_SWITCH_FLAG) === '1';
    } catch {
      // если sessionStorage недоступен, просто живём без спец-логики
      return false;
    }
  };

  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const transitionsRestoredRef = useRef(false);

  // Управляем заливкой сами
  const [isFilled, setIsFilled] = useState(() => getInitialFromSwitch());
  // На самый первый кадр после перехода с переключателя или при загрузке с наведённым курсором
  // гасим transition, чтобы заливка появилась сразу, без "подъёма"
  const [initialFromSwitch, setInitialFromSwitch] = useState(() => getInitialFromSwitch());

  // При маунте проверяем, не пришли ли мы только что после клика по переключателю
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const node = linkRef.current;
    if (!node || transitionsRestoredRef.current) return;

    try {
      if (node.matches(':hover')) {
        setIsFilled(true);
        setInitialFromSwitch(true);
      }
    } catch {
      // если match не сработает, просто продолжаем как есть
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const fromSwitch = window.sessionStorage.getItem(LANG_SWITCH_FLAG) === '1';
      if (!fromSwitch) return;

      window.sessionStorage.removeItem(LANG_SWITCH_FLAG);

      // Сразу включаем заливку (но без анимации)
      setIsFilled(true);
      setInitialFromSwitch(true);
    } catch {
      // если sessionStorage недоступен, просто живём без спец-логики
    }
  }, []);

  useEffect(() => {
    if (!initialFromSwitch) return;

    const t = window.setTimeout(() => {
      // После этого hover/leave снова будут анимироваться
      setInitialFromSwitch(false);
    }, 50);

    return () => window.clearTimeout(t);
  }, [initialFromSwitch]);

  useEffect(() => {
    if (!initialFromSwitch) {
      transitionsRestoredRef.current = true;
    }
  }, [initialFromSwitch]);

  const markSwitchInSession = () => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(LANG_SWITCH_FLAG, '1');
    } catch {
      // ок, просто без спец-поведения
    }
  };

  const handleMouseEnter = () => setIsFilled(true);
  const handleFocus = () => setIsFilled(true);
  const handleMouseLeave = () => setIsFilled(false);
  const handleBlur = () => setIsFilled(false);

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={buttonClassNames({
        variant: 'ghost',
        size: 'sm',
        className: cn(
          baseClasses,
          'group',
          // Глушим hover-фон ghost-варианта, чтобы "заливка" была только наша
          'hover:bg-transparent focus-visible:bg-transparent',
        ),
      })}
      aria-label={ariaLabel}
    >
      {/* Заливка: управляем только стейтом */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-brand-50',
          // Если пришли сразу после переключения — убираем transition, чтобы не было повторной анимации
          !initialFromSwitch && 'transition-transform duration-300 ease-out',
          'group-hover:translate-y-0 group-focus-visible:translate-y-0',
          isFilled ? 'translate-y-0' : 'translate-y-full',
        )}
      />

      {/* Текст: оставляем "подпрыгивание" на hover/active как было */}
      <span className="relative z-10 transition-transform duration-300 ease-out group-hover:-translate-y-[1px] group-active:translate-y-[1px]">
        {label}
      </span>
    </Link>
  );
}