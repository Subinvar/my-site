"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type React from "react";

import type { NavigationLink } from "@/lib/keystatic";
import { cn } from "@/lib/cn";
import { navUnderlineSpanClass } from "@/lib/nav-underline";
import {
  DESKTOP_DROPDOWN_CLOSE_MS,
  DESKTOP_DROPDOWN_OPEN_MS,
  DESKTOP_DROPDOWN_TEXT_ENTER_DELAY_MS,
  DESKTOP_DROPDOWN_TEXT_ENTER_MS,
  DESKTOP_DROPDOWN_TEXT_EXIT_MS,
  DESKTOP_DROPDOWN_TEXT_STAGGER_MS,
} from "@/lib/nav-motion";

type HeaderDesktopDropdownProps = {
  links: NavigationLink[];
  activeId: string | null;
  currentPath: string;
  prefersReducedMotion: boolean;
  closeLabel: string;
  onPanelEnter?: () => void;
  onPanelLeave?: () => void;
  onRequestClose?: () => void;
};

const normalizePathname = (value: string): string => {
  const [pathWithoutQuery] = value.split("?");
  const [path] = (pathWithoutQuery ?? "").split("#");
  const trimmed = (path ?? "/").replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
};

const resolveHref = (href: string): string => {
  const normalized = (href ?? "").trim();
  return normalized.length ? normalized : "/";
};

const getChildren = (links: NavigationLink[], id: string | null): NavigationLink[] => {
  if (!id) return [];
  const link = links.find((item) => item.id === id);
  return link?.children ?? [];
};

/**
 * Mega menu (Apple-like):
 * - Full-width panel that раскрывается от нижнего края шапки.
 * - Высота панели плавно анимируется под контент.
 * - Всё, что ниже меню, блюрится и слегка затемняется.
 */
export function HeaderDesktopDropdown({
  links,
  activeId,
  currentPath,
  prefersReducedMotion,
  closeLabel,
  onPanelEnter,
  onPanelLeave,
  onRequestClose,
}: HeaderDesktopDropdownProps) {
  const normalizedCurrent = useMemo(() => normalizePathname(currentPath), [currentPath]);

  const [isMounted, setIsMounted] = useState(false);
  const [renderedId, setRenderedId] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState<number>(0);
  const [contentPhase, setContentPhase] = useState<0 | 1>(0);
  const [enterReady, setEnterReady] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(false);
  const openRafRef = useRef<number | null>(null);

  const scheduleStateUpdate = (update: () => void) => queueMicrotask(update);

  const activeChildren = useMemo(() => getChildren(links, activeId), [activeId, links]);
  const shouldBeOpen = Boolean(activeId && activeChildren.length);

  const renderedChildren = meansRenderedChildren(links, renderedId);
  const isOpen = isMounted && shouldBeOpen && (prefersReducedMotion || enterReady);
  const isClosing = isMounted && !shouldBeOpen;
  // Mount / unmount for close animation.
  useEffect(() => {
    if (shouldBeOpen && activeId) {
      scheduleStateUpdate(() => {
        setIsMounted(true);
        setRenderedId(activeId);
      });

      // Первый кадр после монтирования: держим закрытое состояние,
      // чтобы самое первое раскрытие анимировалось (иначе оно 'прыгает' мгновенно).
      if (prefersReducedMotion) {
        scheduleStateUpdate(() => setEnterReady(true));
        return;
      }

      if (openRafRef.current) {
        window.cancelAnimationFrame(openRafRef.current);
        openRafRef.current = null;
      }

      if (!isMounted) {
        scheduleStateUpdate(() => setEnterReady(false));
        openRafRef.current = window.requestAnimationFrame(() => {
          openRafRef.current = null;
          setEnterReady(true);
        });
      } else {
        scheduleStateUpdate(() => setEnterReady(true));
      }

      return;
    }

    if (!isMounted) return;

    if (openRafRef.current) {
      window.cancelAnimationFrame(openRafRef.current);
      openRafRef.current = null;
    }

    scheduleStateUpdate(() => setEnterReady(false));

    const duration = prefersReducedMotion ? 0 : DESKTOP_DROPDOWN_CLOSE_MS;
    const timer = window.setTimeout(() => {
      setIsMounted(false);
      setRenderedId(null);
      setPanelHeight(0);
      setContentPhase(0);
      setEnterReady(false);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [activeId, isMounted, prefersReducedMotion, shouldBeOpen]);

  // When switching between menu items while open — update rendered id immediately.
  useEffect(() => {
    if (!shouldBeOpen || !activeId) return;
    scheduleStateUpdate(() => setRenderedId(activeId));
  }, [activeId, shouldBeOpen]);

  // Measure content height (numeric px) so we can animate height (can't animate auto).
  useLayoutEffect(() => {
    if (!isMounted || !contentRef.current || typeof ResizeObserver === "undefined") return;

    const el = contentRef.current;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const next = Math.max(0, Math.ceil(rect.height));
      setPanelHeight(next);
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();

    return () => ro.disconnect();
  }, [isMounted, renderedId]);

  // Text animation: delayed cascade on first open; quicker on switching.
  useEffect(() => {
    if (!isMounted || !renderedId) return;

    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = shouldBeOpen;

    // When closing — start dissolving immediately.
    if (!shouldBeOpen) {
      scheduleStateUpdate(() => setContentPhase(0));
      return;
    }

    scheduleStateUpdate(() => setContentPhase(0));

    if (prefersReducedMotion) {
      scheduleStateUpdate(() => setContentPhase(1));
      return;
    }

    // On first open we delay the text a bit to let the panel begin expanding.
    const delay = wasOpen ? 0 : DESKTOP_DROPDOWN_TEXT_ENTER_DELAY_MS;
    const t = window.setTimeout(() => setContentPhase(1), delay);
    return () => window.clearTimeout(t);
  }, [isMounted, prefersReducedMotion, renderedId, shouldBeOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen || !onRequestClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onRequestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onRequestClose]);

  const handleBlurCapture = onPanelLeave
    ? (event: React.FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget;
        if (next && event.currentTarget.contains(next as Node)) return;
        onPanelLeave();
      }
    : undefined;

  if (!isMounted || !renderedId || renderedChildren.length === 0) {
    return null;
  }
  const panelDurationMs = prefersReducedMotion
    ? 0
    : shouldBeOpen
      ? DESKTOP_DROPDOWN_OPEN_MS
      : DESKTOP_DROPDOWN_CLOSE_MS;

  const overlayDurationMs = panelDurationMs;

  const transitionClass = prefersReducedMotion ? "transition-none" : "transition-[height]";
  const overlayTransitionClass = prefersReducedMotion
    ? "transition-none"
    : "transition-opacity";

  const panelTransitionStyle = prefersReducedMotion
    ? undefined
    : ({
        transitionDuration: `${panelDurationMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      } as React.CSSProperties);

  const overlayTransitionStyle = prefersReducedMotion
    ? undefined
    : ({
        transitionDuration: `${overlayDurationMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      } as React.CSSProperties);

  const itemsVisible = shouldBeOpen && contentPhase === 1;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[58]"
      style={{ top: "var(--header-height)" }}
      aria-hidden={!isOpen}
    >
      {/*
        Blur layer that covers EVERYTHING below the header (Apple-like).
        The panel itself is above this layer.
      */}
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onRequestClose}
        tabIndex={-1}
        style={overlayTransitionStyle}
        className={cn(
          "absolute inset-0 z-0",
          overlayTransitionClass,
          "motion-reduce:transition-none motion-reduce:duration-0",

          "bg-black/15 backdrop-blur-2xl",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      {/* Full-width dropdown panel that раскрывается от нижнего края шапки */}
      <div
        onPointerEnter={onPanelEnter}
        onPointerLeave={onPanelLeave}
        onFocusCapture={onPanelEnter}
        onBlurCapture={handleBlurCapture}
        className={cn(
          "relative z-10 w-full",
          "overflow-hidden",
          // Surface
          "bg-background/96",
          "shadow-[0_24px_60px_rgba(0,0,0,0.12)]",
          // Nice edge where it attaches to header
          "border-b border-[color:var(--header-border)]",
          transitionClass,
          "motion-reduce:transition-none motion-reduce:duration-0",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        style={{
          height: isOpen ? `${panelHeight}px` : "0px",
          ...(panelTransitionStyle ?? {}),
        }}
      >
        <div
          ref={contentRef}
          className={cn(
            "mx-auto w-full max-w-screen-2xl",
            "px-[var(--header-pad-x)]",
            // Vertical rhythm similar to Apple
            "py-8",
            "motion-reduce:transition-none motion-reduce:duration-0",
            itemsVisible ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <nav aria-label={renderedId}>
            <ul className="m-0 grid list-none gap-x-12 gap-y-2 p-0 md:max-w-[520px]">
              {renderedChildren.map((item, index) => {
                const href = resolveHref(item.href);
                const normalizedHref = normalizePathname(href);
                const isActive =
                  !item.isExternal &&
                  (normalizedHref === normalizedCurrent ||
                    (normalizedHref !== "/" && normalizedCurrent.startsWith(`${normalizedHref}/`)));

                const itemDelay = prefersReducedMotion
                  ? 0
                  : shouldBeOpen
                    ? index * DESKTOP_DROPDOWN_TEXT_STAGGER_MS
                    : 0;

                const itemDuration = prefersReducedMotion
                  ? 0
                  : shouldBeOpen
                    ? DESKTOP_DROPDOWN_TEXT_ENTER_MS
                    : DESKTOP_DROPDOWN_TEXT_EXIT_MS;

                const itemStyle = {
                  transitionDelay: `${itemDelay}ms`,
                  transitionDuration: `${itemDuration}ms`,
                  transitionTimingFunction: shouldBeOpen
                    ? "cubic-bezier(0.16,1,0.3,1)"
                    : "cubic-bezier(0.2,0,0.38,0.9)",
                } satisfies React.CSSProperties;

                const itemMotionClass = prefersReducedMotion
                  ? ""
                  : cn(
                      "will-change-[opacity,transform]",
                      "transition-[opacity,transform]",
                      itemsVisible
                        ? "opacity-100 translate-y-0"
                        : isClosing
                          ? "opacity-0 translate-y-0"
                          : "opacity-0 translate-y-3",
                    );

                const linkClassName = cn(
                  "group inline-flex w-full items-center",
                  "py-2",
                  // Apple-like: крупнее, но в рамках фирменного стиля
                  "font-[var(--font-heading)]",
                  "text-[clamp(1.15rem,1.02rem+0.6vw,1.6rem)]",
                  "font-medium leading-[1.12] tracking-[-0.01em]",
                  "no-underline transition-colors",
                  "active:opacity-90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                );

                if (item.isExternal) {
                  return (
                    <li key={item.id} className={itemMotionClass} style={itemStyle}>
                      <a
                        href={href}
                        target={item.newTab ? "_blank" : undefined}
                        rel={item.newTab ? "noopener noreferrer" : undefined}
                        className={linkClassName}
                      >
                        <span className={navUnderlineSpanClass(isActive, "menu")}>{item.label}</span>
                      </a>
                    </li>
                  );
                }

                return (
                  <li key={item.id} className={itemMotionClass} style={itemStyle}>
                    <Link href={href} className={linkClassName} aria-current={isActive ? "page" : undefined}>
                      <span className={navUnderlineSpanClass(isActive, "menu")}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

function meansRenderedChildren(links: NavigationLink[], id: string | null): NavigationLink[] {
  return getChildren(links, id);
}
