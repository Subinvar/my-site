'use client';

import { useLayoutEffect, useRef } from 'react';

type HeaderBrandFlipTextProps = {
  text: string;
  className?: string;
};

export function HeaderBrandFlipText({ text, className }: HeaderBrandFlipTextProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const previousRef = useRef<{ rects: Map<string, DOMRect>; width: number } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const getSpans = () => container.querySelectorAll<HTMLSpanElement>('[data-word-id]');

    const measure = () => {
      const spans = getSpans();
      const rects = new Map<string, DOMRect>();
      spans.forEach((span) => {
        const id = span.dataset.wordId;
        if (!id) return;
        rects.set(id, span.getBoundingClientRect());
      });

      const width = container.getBoundingClientRect().width;

      return { rects, width };
    };

    // Начальное измерение, без анимации
    previousRef.current = measure();

    const observer = new ResizeObserver(() => {
      const container = containerRef.current;
      if (!container) return;

      const previous = previousRef.current;
      if (!previous) {
        previousRef.current = measure();
        return;
      }

      const spans = getSpans();
      if (!spans.length) return;

      // Сброс transform/transition, чтобы замерить чистую новую раскладку
      spans.forEach((span) => {
        span.style.transition = 'none';
        span.style.transform = '';
      });

      const next = measure();
      if (!next) return;

      const prevWidth = previous.width;
      const nextWidth = next.width;
      const widthDelta = Math.abs(nextWidth - prevWidth);

      // Защита от гигантских скачков (например, резкая смена десктоп/мобилка):
      // просто обновляем состояние без анимации
      const BREAKPOINT_JUMP_THRESHOLD = 120; // пикселей
      if (widthDelta > BREAKPOINT_JUMP_THRESHOLD) {
        previousRef.current = next;
        return;
      }

      // FLIP: анимируем только реальные изменения позиций
      spans.forEach((span) => {
        const id = span.dataset.wordId;
        if (!id) return;

        const prevRect = previous.rects.get(id);
        const nextRect = next.rects.get(id);
        if (!prevRect || !nextRect) return;

        const dx = prevRect.left - nextRect.left;
        const dy = prevRect.top - nextRect.top;

        if (!dx && !dy) return;

        // Ставим "старую" позицию без анимации
        span.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      // В следующем кадре плавно возвращаем в норму
      requestAnimationFrame(() => {
        spans.forEach((span) => {
          span.style.transition =
            'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
          span.style.transform = '';
        });
      });

      previousRef.current = next;
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const parts = text.split(/(\s+)/);

  return (
    <span ref={containerRef} className={className}>
      {parts.map((token, index) =>
        /^\s+$/.test(token) ? (
          token
        ) : (
          <span
            key={index}
            data-word-id={String(index)}
            className="inline-block"
          >
            {token}
          </span>
        ),
      )}
    </span>
  );
}
