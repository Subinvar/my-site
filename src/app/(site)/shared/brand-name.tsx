"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

const STACK_MARGIN_IN_PX = 6;
const UNSTACK_MARGIN_IN_PX = 16;
const TRANSITION_DURATION_MS = 210;

type BrandNameProps = {
  label: string;
  className?: string;
};

function splitLabel(label: string): { first: string; second: string } {
  const parts = label.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { first: label.trim(), second: '' };
  }

  const [first, ...rest] = parts;
  return { first, second: rest.join(' ') };
}

export function BrandName({ label, className }: BrandNameProps) {
  const { first, second } = useMemo(() => splitLabel(label), [label]);
  const [isStacked, setIsStacked] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'stacking' | 'unstacking'>('idle');
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const isStackedRef = useRef(isStacked);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measure = () => {
      const items = Array.from(container.querySelectorAll<HTMLElement>('[data-brand-line]'));
      if (!items.length) return;

      const gapValue = (() => {
        const styles = window.getComputedStyle(container);
        const gap = styles.gap || styles.columnGap;
        const value = Number.parseFloat(gap || '0');
        return Number.isFinite(value) ? value : 0;
      })();

      const totalLineWidth = items.reduce((sum, item) => sum + item.getBoundingClientRect().width, 0);
      const totalGapWidth = gapValue * Math.max(items.length - 1, 0);
      const availableWidth = container.getBoundingClientRect().width;
      const requiredWidth = totalLineWidth + totalGapWidth;

      const shouldStack = isStackedRef.current
        ? requiredWidth > availableWidth - UNSTACK_MARGIN_IN_PX
        : requiredWidth > availableWidth - STACK_MARGIN_IN_PX;

      if (shouldStack !== isStackedRef.current) {
        isStackedRef.current = shouldStack;
        setIsStacked(shouldStack);
      }
    };

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(measure);
    });

    observer.observe(container);
    measure();
    setIsReady(true);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isReady) return undefined;
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return undefined;
    }

    setTransitionPhase(isStacked ? 'stacking' : 'unstacking');
    const timer = window.setTimeout(() => setTransitionPhase('idle'), TRANSITION_DURATION_MS + 40);
    return () => window.clearTimeout(timer);
  }, [isReady, isStacked]);

  return (
    <span
      ref={containerRef}
      className={cn('brand-name', className)}
      data-ready={isReady ? 'true' : 'false'}
      data-stacked={isStacked ? 'true' : 'false'}
      data-transition={transitionPhase}
      aria-label={label}
    >
      <span data-brand-line className="brand-line brand-line--top">
        {first}
      </span>
      {second ? (
        <span data-brand-line className="brand-line brand-line--bottom">
          {second}
        </span>
      ) : null}
    </span>
  );
}
