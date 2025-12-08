// src/app/(site)/shared/ui/use-pill-fill.ts
'use client';

import { useState } from 'react';

import { cn } from '@/lib/cn';

type UsePillFillOptions = {
  /**
   * Стартовое состояние заливки до первой интеракции.
   * Для кейсов типа "пришли с другой страницы с уже наведённым курсором"
   * можно стартовать с true и потом скорректировать в эффекте.
   */
  initialFilled?: boolean;
};

export function usePillFill(options: UsePillFillOptions = {}) {
  const { initialFilled = false } = options;

  const [isFilled, setIsFilled] = useState<boolean>(initialFilled);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const markInteracted = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleMouseEnter = () => {
    markInteracted();
    setIsFilled(true);
  };

  const handleFocus = () => {
    markInteracted();
    setIsFilled(true);
  };

  const handleMouseLeave = () => {
    markInteracted();
    setIsFilled(false);
  };

  const handleBlur = () => {
    markInteracted();
    setIsFilled(false);
  };

  const fillClassName = cn(
    'pointer-events-none absolute inset-0 bg-brand-50',
    // Анимацию включаем только после первой реальной интеракции,
    // чтобы программные установки состояния были "без рывков".
    hasInteracted && 'transition-transform duration-300 ease-out',
    isFilled ? 'translate-y-0' : 'translate-y-full',
  );

  return {
    // состояния
    isFilled,
    setIsFilled,
    hasInteracted,
    // классы для span-заливки
    fillClassName,
    // обработчики для навешивания на Link/Button
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
  };
}
