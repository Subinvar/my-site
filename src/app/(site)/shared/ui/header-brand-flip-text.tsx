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

    // Общая длительность перемещения слова «от старта до новой точки».
    // Меняем этот параметр, чтобы растягивать или ускорять весь перелёт целиком.
    const travelDuration = 760;

    // Доля времени на фазу ухода (fade/slide out), остальное — на фазу появления.
    // Если хотите ещё больше времени на перелёт, увеличьте travelDuration выше.
    const exitDuration = Math.round(travelDuration * 0.35);
    const enterDuration = Math.round(travelDuration * 0.65);

    // Небольшая задержка между фазами, чтобы выход был заметен.
    const phaseDelay = 100;

    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    // Стартовая раскладка: просто запоминаем, без анимации
    previousRef.current = measure();

    const playFlip = () => {
      const container = containerRef.current;
      if (!container) return;

      const previous = previousRef.current;
      const spans = getSpans();
      if (!previous || !spans.length) {
        previousRef.current = measure();
        return;
      }

      // Лёгкий уход, чтобы смена строк была видимой
      spans.forEach((span) => {
        span.style.transition = `opacity ${exitDuration}ms ease-in-out, transform ${exitDuration}ms ease-in-out`;
        span.style.opacity = '0';
        span.style.transform = 'translateY(-6px)';
      });

      setTimeout(() => {
        // Сбрасываем transform, чтобы замерить новую раскладку «как есть»
        spans.forEach((span) => {
          span.style.transition = 'none';
          span.style.transform = '';
        });

        const next = measure();
        if (!next) return;

        // FLIP: ставим старые координаты и легкое появление
        spans.forEach((span) => {
          const id = span.dataset.wordId;
          if (!id) return;

          const prevRect = previous.get(id);
          const nextRect = next.get(id);
          if (!prevRect || !nextRect) return;

          const dx = prevRect.left - nextRect.left;
          const dy = prevRect.top - nextRect.top;

          span.style.transform = `translate(${dx}px, ${dy + 6}px)`;
          span.style.opacity = '0';
        });

        requestAnimationFrame(() => {
          spans.forEach((span) => {
            span.style.transition = `transform ${enterDuration}ms ease-in-out ${phaseDelay}ms, opacity ${enterDuration}ms ease-in-out ${phaseDelay}ms`;
            span.style.transform = '';
            span.style.opacity = '1';
          });
        });

        previousRef.current = next;
      }, exitDuration + phaseDelay);
    };

    const observer = new ResizeObserver(() => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      debounceTimeout = setTimeout(playFlip, 120);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
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
