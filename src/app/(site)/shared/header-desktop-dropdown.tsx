"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type React from "react";

import type { NavigationLink } from "@/lib/keystatic";
import { cn } from "@/lib/cn";
import { navUnderlineSpanClass } from "@/lib/nav-underline";

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

  const contentRef = useRef<HTMLDivElement | null>(null);

  const activeChildren = useMemo(() => getChildren(links, activeId), [activeId, links]);
  const shouldBeOpen = Boolean(activeId && activeChildren.length);

  const renderedChildren = meansRenderedChildren(links, renderedId);

  const isOpen = isMounted && shouldBeOpen;

  // Mount / unmount for close animation.
  useEffect(() => {
    if (shouldBeOpen && activeId) {
      setIsMounted(true);
      setRenderedId(activeId);
      return;
    }

    if (!isMounted) return;

    const duration = prefersReducedMotion ? 0 : 420;
    const timer = window.setTimeout(() => {
      setIsMounted(false);
      setRenderedId(null);
      setPanelHeight(0);
      setContentPhase(0);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [activeId, isMounted, prefersReducedMotion, shouldBeOpen]);

  // When switching between menu items while open — update rendered id immediately.
  useEffect(() => {
    if (!shouldBeOpen || !activeId) return;
    setRenderedId(activeId);
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

  // Animate content in (subtle) when menu opens / switches.
  useEffect(() => {
    if (!isMounted || !renderedId) return;
    setContentPhase(0);
    const raf = window.requestAnimationFrame(() => setContentPhase(1));
    return () => window.cancelAnimationFrame(raf);
  }, [isMounted, renderedId]);

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

  const transitionClass = prefersReducedMotion
    ? "transition-none"
    : "transition-[height] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]";

  const overlayTransitionClass = prefersReducedMotion
    ? "transition-none"
    : "transition-[opacity,background-color,backdrop-filter] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]";

  const contentTransitionClass = prefersReducedMotion
    ? "transition-none"
    : "transition-[opacity,transform] duration-[260ms] ease-out";

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
        className={cn(
          "absolute inset-0 z-0",
          overlayTransitionClass,
          "motion-reduce:transition-none motion-reduce:duration-0",
          isOpen
            ? "pointer-events-auto opacity-100 bg-black/15 backdrop-blur-2xl"
            : "pointer-events-none opacity-0 bg-black/0 backdrop-blur-0",
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
        style={{ height: isOpen ? `${panelHeight}px` : "0px" }}
      >
        <div
          ref={contentRef}
          className={cn(
            "mx-auto w-full max-w-screen-2xl",
            "px-[var(--header-pad-x)]",
            // Vertical rhythm similar to Apple
            "py-8",
            contentTransitionClass,
            "motion-reduce:transition-none motion-reduce:duration-0",
            isOpen && contentPhase === 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
          )}
        >
          <nav aria-label={renderedId}>
            <ul className="m-0 grid list-none gap-x-12 gap-y-2 p-0 md:max-w-[520px]">
              {renderedChildren.map((item) => {
                const href = resolveHref(item.href);
                const normalizedHref = normalizePathname(href);
                const isActive =
                  !item.isExternal &&
                  (normalizedHref === normalizedCurrent ||
                    (normalizedHref !== "/" && normalizedCurrent.startsWith(`${normalizedHref}/`)));

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
                    <li key={item.id}>
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
                  <li key={item.id}>
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
