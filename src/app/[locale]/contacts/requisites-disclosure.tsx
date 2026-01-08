'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';
import { BURGER_MENU_CLOSE_MS, BURGER_MENU_OPEN_MS } from '@/lib/nav-motion';

type RequisitesDisclosureProps = {
  /**
   * Anchor id of the section (without "#").
   * Used to auto-open when the page hash matches.
   */
  anchorId: string;
  title: string;
  description: string;
  children: ReactNode;
};

const EASING = 'cubic-bezier(0.16,1,0.3,1)';

/**
 * Contacts page disclosure with burger-like animation timing and a +/− toggle.
 */
export function RequisitesDisclosure({
  anchorId,
  title,
  description,
  children,
}: RequisitesDisclosureProps) {
  const regionId = useId();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const regionRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const mountedRef = useRef(false);

  // Auto-open when the hash matches (clicking the "Requisites" action card).
  useEffect(() => {
    const targetHash = `#${anchorId}`;

    const syncFromHash = () => {
      if (window.location.hash === targetHash) {
        setIsOpen(true);
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [anchorId]);

  // Height animation (burger-like). We animate the outer wrapper's height.
  useLayoutEffect(() => {
    const contentEl = contentRef.current;
    const regionEl = regionRef.current;
    if (!contentEl || !regionEl) return;

    // Prevent a close animation on the initial render.
    if (!mountedRef.current) {
      mountedRef.current = true;
      regionEl.style.height = isOpen ? 'auto' : '0px';
      return;
    }

    if (prefersReducedMotion) {
      regionEl.style.height = isOpen ? 'auto' : '0px';
      return;
    }

    const currentHeight = contentEl.scrollHeight;

    if (isOpen) {
      // Opening: 0 -> scrollHeight
      regionEl.style.height = '0px';
      const frame = window.requestAnimationFrame(() => {
        const nextHeight = contentEl.scrollHeight;
        regionEl.style.height = `${nextHeight}px`;
      });
      return () => window.cancelAnimationFrame(frame);
    }

    // Closing: scrollHeight -> 0
    regionEl.style.height = `${currentHeight}px`;
    const frame = window.requestAnimationFrame(() => {
      regionEl.style.height = '0px';
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, prefersReducedMotion]);

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={regionId}
        className={cn(
          'flex w-full items-start justify-between gap-4 rounded-lg px-2 py-2 text-left',
          focusRingBase,
        )}
      >
        <span className="space-y-1">
          <span className="block text-lg font-semibold text-foreground">{title}</span>
          <span className="block text-sm text-muted-foreground">{description}</span>
        </span>

        <PlusMinusIcon isOpen={isOpen} />
      </button>

      <div
        id={regionId}
        role="region"
        aria-label={title}
        ref={regionRef}
        className={cn(
          'overflow-hidden will-change-[height]',
          prefersReducedMotion ? 'transition-none' : 'transition-[height]',
        )}
        style={{
          height: isOpen ? 'auto' : '0px',
          transitionDuration: `${isOpen ? BURGER_MENU_OPEN_MS : BURGER_MENU_CLOSE_MS}ms`,
          transitionTimingFunction: EASING,
        }}
        onTransitionEnd={(event) => {
          if (event.propertyName !== 'height') return;
          if (!regionRef.current) return;
          if (prefersReducedMotion) return;

          // After opening finishes, unlock the height to allow responsive reflow.
          if (isOpen) {
            regionRef.current.style.height = 'auto';
          }
        }}
      >
        <div ref={contentRef} className="mt-5 space-y-6 px-2">
          {children}
        </div>
      </div>
    </div>
  );
}

function PlusMinusIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative mt-1 h-5 w-5 shrink-0 text-muted-foreground"
    >
      {/* horizontal */}
      <span
        className={cn(
          'absolute left-1/2 top-1/2 h-[2px] w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-current',
        )}
      />
      {/* vertical */}
      <span
        className={cn(
          'absolute left-1/2 top-1/2 h-full w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current',
          'origin-center transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen ? 'scale-y-0 opacity-0' : 'scale-y-100 opacity-100',
        )}
      />
    </span>
  );
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {};

      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handle = () => callback();

      // Safari < 14 uses addListener/removeListener.
      if (mq.addEventListener) {
        mq.addEventListener('change', handle);
        return () => mq.removeEventListener('change', handle);
      }

      mq.addListener(handle);
      return () => mq.removeListener(handle);
    },
    () => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    () => false,
  );
}