'use client';

import { useLayoutEffect, useRef } from 'react';

type HeaderBrandFlipTextProps = {
  text: string;
  className?: string;
};

export function HeaderBrandFlipText({ text, className }: HeaderBrandFlipTextProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const previousRef = useRef<Map<string, DOMRect> | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const getSpans = () =>
      container.querySelectorAll<HTMLSpanElement>('[data-word-id]');

    const measure = () => {
      const spans = getSpans();
      const rects = new Map<string, DOMRect>();
      spans.forEach((span) => {
        const id = span.dataset.wordId;
        if (!id) return;
        rects.set(id, span.getBoundingClientRect());
      });
      return rects;
    };

    // Стартовая раскладка: просто запоминаем, без анимации
    previousRef.current = measure();

    const observer = new ResizeObserver(() => {
      const container = containerRef.current;
      if (!container) return;

      const previous = previousRef.current;
      const spans = getSpans();
      if (!previous || !spans.length) {
        previousRef.current = measure();
        return;
      }

      // Сбрасываем transform, чтобы замерить новую раскладку «как есть»
      spans.forEach((span) => {
        span.style.transition = 'none';
        span.style.transform = '';
      });

      const next = measure();
      if (!next) return;

      // FLIP: ставим старые координаты
      spans.forEach((span) => {
        const id = span.dataset.wordId;
        if (!id) return;

        const prevRect = previous.get(id);
        const nextRect = next.get(id);
        if (!prevRect || !nextRect) return;

        const dx = prevRect.left - nextRect.left;
        const dy = prevRect.top - nextRect.top;

        if (!dx && !dy) return;

        span.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      // И плавно едем к новым
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
