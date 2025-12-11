'use client';

import { useLayoutEffect, useRef, type ElementType } from 'react';

import { cn } from '@/lib/cn';

type AnimatedWordsProps = {
  text: string;
  className?: string;
  as?: ElementType;      // 'span', 'p', 'h1', кастомный компонент и т.д.
  enableFlip?: boolean;  // включить/выключить FLIP для этого блока
  flipKey?: unknown;     // ключ макета: меняется -> запускаем FLIP
};

/**
 * Чистый FLIP для слов.
 * Не слушает resize окна сам по себе, а реагирует только на deps (text, flipKey).
 */
function useWordFlipAnimation(enable: boolean, deps: unknown[]) {
  const ref = useRef<HTMLElement | null>(null);
  const previousRectsRef = useRef<Map<string, DOMRect> | null>(null);

  useLayoutEffect(() => {
    if (!enable) return;

    const container = ref.current;
    if (!container) return;

    const spans = container.querySelectorAll<HTMLSpanElement>('[data-word-id]');
    if (!spans.length) return;

    const nextRects = new Map<string, DOMRect>();
    spans.forEach((span) => {
      const id = span.dataset.wordId;
      if (!id) return;
      nextRects.set(id, span.getBoundingClientRect());
    });

    const previousRects = previousRectsRef.current;

    // Первый прогон (монтаж) – только запоминаем, без анимации
    if (!previousRects) {
      previousRectsRef.current = nextRects;
      return;
    }

    spans.forEach((span) => {
      const id = span.dataset.wordId;
      if (!id) return;

      const prev = previousRects.get(id);
      const next = nextRects.get(id);
      if (!prev || !next) return;

      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (!dx && !dy) return;

      // Ставим "старую" позицию без анимации
      span.style.transition = 'none';
      span.style.transform = `translate(${dx}px, ${dy}px)`;

      // В следующем кадре — плавно к новой позиции
      requestAnimationFrame(() => {
        span.style.transition =
          'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)';
        span.style.transform = '';
      });
    });

    // Запоминаем актуальные координаты как "предыдущие"
    previousRectsRef.current = nextRects;
  }, [enable, ...deps]);

  return ref;
}

export function AnimatedWords({
  text,
  className,
  as,
  enableFlip = false,
  flipKey,
}: AnimatedWordsProps) {
  const Wrapper: ElementType = as ?? 'span';

  // FLIP включится только если enableFlip === true
  const containerRef = useWordFlipAnimation(enableFlip, [text, flipKey]);

  const tokens = text.split(/(\s+)/);

  return (
    <Wrapper ref={containerRef} className={cn(className)}>
      {tokens.map((token, index) => {
        if (/^\s+$/.test(token)) {
          return token;
        }

        return (
          <span key={index} data-word-id={String(index)} className="motion-word inline-block">
            {token}
          </span>
        );
      })}
    </Wrapper>
  );
}
