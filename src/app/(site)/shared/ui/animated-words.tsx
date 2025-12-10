'use client';

import { useLayoutEffect, useRef, type ElementType, type Ref } from 'react';

import { cn } from '@/lib/cn';
import { useInView } from '@/lib/use-in-view';

type WrapperTag = 'span' | 'div' | 'p' | 'strong' | 'em';

type AnimatedWordsProps<T extends WrapperTag = 'span'> = {
  text: string;
  className?: string;
  as?: T;
};

function useWordFlipAnimation<T extends HTMLElement = HTMLElement>(text: string) {
  const ref = useRef<T | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const getSpans = () => container.querySelectorAll<HTMLSpanElement>('[data-word-id]');

    const measureRects = () => {
      const rects = new Map<string, DOMRect>();
      getSpans().forEach((span) => {
        const id = span.dataset.wordId;
        if (!id) return;
        rects.set(id, span.getBoundingClientRect());
      });
      return rects;
    };

    let previousRects = measureRects();

    const animate = () => {
      const nextRects = measureRects();

      getSpans().forEach((span) => {
        const id = span.dataset.wordId;
        if (!id) return;

        const prev = previousRects.get(id);
        const next = nextRects.get(id);
        if (!prev || !next) return;

        const dx = prev.left - next.left;
        const dy = prev.top - next.top;

        if (!dx && !dy) return;

        span.style.transition = 'none';
        span.style.transform = `translate(${dx}px, ${dy}px)`;

        requestAnimationFrame(() => {
          span.style.transition = '';
          span.style.transform = '';
        });
      });

      previousRects = nextRects;
    };

    const queueAnimation = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(queueAnimation);
    resizeObserver.observe(container);
    window.addEventListener('resize', queueAnimation);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', queueAnimation);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [text]);

  return ref;
}

export function AnimatedWords<T extends WrapperTag = 'span'>({ text, className, as = 'span' as T }: AnimatedWordsProps<T>) {
  const { ref: inViewRef, inView } = useInView<HTMLElement>({ rootMargin: '-10% 0px', once: true });
  const flipRef = useWordFlipAnimation<HTMLElement>(text);
  const mergedRef = useRef<HTMLElementTagNameMap[T] | null>(null);

  useLayoutEffect(() => {
    inViewRef.current = mergedRef.current;
    flipRef.current = mergedRef.current;
  }, [inViewRef, flipRef]);

  const tokens = text.split(/(\s+)/);

  const Wrapper = as ?? 'span';

  const WrapperComponent = Wrapper as ElementType;

  return (
    <WrapperComponent
      ref={mergedRef as Ref<HTMLElementTagNameMap[T]>}
      className={cn('motion-words', className)}
      data-in-view={inView ? 'true' : 'false'}
    >
      {tokens.map((token, index) => {
        if (/^\s+$/.test(token)) {
          return token;
        }

        return (
          <span
            key={index}
            data-word-id={index}
            className="motion-word inline-block"
            style={{ transitionDelay: `${index * 80}ms` }}
          >
            {token}
          </span>
        );
      })}
    </WrapperComponent>
  );
}
