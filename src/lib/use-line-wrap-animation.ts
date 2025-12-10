import { useEffect, useRef } from 'react';

const DEFAULT_DURATION = 180;
const DEFAULT_DEBOUNCE = 80;

function getLineCount(node: HTMLElement): number {
  const style = window.getComputedStyle(node);
  const lineHeight = parseFloat(style.lineHeight);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    return 1;
  }

  const height = node.getBoundingClientRect().height;
  const approximate = Math.max(1, Math.round(height / lineHeight));
  return approximate;
}

type Options = {
  animationDurationMs?: number;
  debounceMs?: number;
};

export function useLineWrapAnimation<T extends HTMLElement>({
  animationDurationMs = DEFAULT_DURATION,
  debounceMs = DEFAULT_DEBOUNCE,
}: Options = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    let lastLineCount = getLineCount(element);
    let frameId: number | null = null;
    let debounceTimer: number | null = null;
    let resetTimer: number | null = null;

    const triggerAnimation = (lineCount: number) => {
      element.dataset.lineWrapLines = String(lineCount);
      element.dataset.lineWrapAnimating = 'false';
      // Force reflow to restart animation reliably
      void element.getBoundingClientRect();
      element.dataset.lineWrapAnimating = 'true';

      if (resetTimer) {
        window.clearTimeout(resetTimer);
      }

      resetTimer = window.setTimeout(() => {
        if (element.dataset.lineWrapAnimating === 'true') {
          element.dataset.lineWrapAnimating = 'idle';
        }
      }, animationDurationMs + 40);
    };

    const measure = () => {
      const nextLineCount = getLineCount(element);
      if (nextLineCount !== lastLineCount) {
        lastLineCount = nextLineCount;
        triggerAnimation(nextLineCount);
      }
    };

    const scheduleMeasure = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(measure);
    };

    const handleResize = () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(scheduleMeasure, debounceMs);
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(element);

    scheduleMeasure();

    return () => {
      observer.disconnect();
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
      if (resetTimer) {
        window.clearTimeout(resetTimer);
      }
    };
  }, [animationDurationMs, debounceMs]);

  return ref;
}
