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

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
};

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
  const [panelLeft, setPanelLeft] = useState<number>(0);
  const [panelSize, setPanelSize] = useState<{ width: number; height: number }>({
    width: 320,
    height: 120,
  });

  const panelRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const renderedLink = useMemo(() => {
    if (!renderedId) return null;
    return links.find((link) => link.id === renderedId) ?? null;
  }, [links, renderedId]);

  const renderedItems = renderedLink?.children ?? [];
  const shouldBeOpen = Boolean(activeId && (links.find((l) => l.id === activeId)?.children?.length ?? 0));

  useEffect(() => {
    if (shouldBeOpen && activeId) {
      setIsMounted(true);
      setRenderedId(activeId);
      return;
    }

    if (!isMounted) return;

    const duration = prefersReducedMotion ? 0 : 280;
    const t = window.setTimeout(() => {
      setIsMounted(false);
      setRenderedId(null);
    }, duration);
    return () => window.clearTimeout(t);
  }, [activeId, isMounted, prefersReducedMotion, shouldBeOpen]);

  useEffect(() => {
    if (!isMounted || !contentRef.current) return;

    const el = contentRef.current;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setPanelSize({
        width: Math.max(240, Math.ceil(rect.width)),
        height: Math.max(64, Math.ceil(rect.height)),
      });
    });
    ro.observe(el);

    // начальное измерение
    const rect = el.getBoundingClientRect();
    setPanelSize({
      width: Math.max(240, Math.ceil(rect.width)),
      height: Math.max(64, Math.ceil(rect.height)),
    });

    return () => ro.disconnect();
  }, [isMounted, renderedId]);

  useLayoutEffect(() => {
    if (!isMounted || !renderedId) return;

    const update = () => {
      const selector = `[data-nav-trigger="${CSS.escape(renderedId)}"]`;
      const anchor = document.querySelector(selector) as HTMLElement | null;
      if (!anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      const desired = anchorRect.left + anchorRect.width / 2 - panelSize.width / 2;

      const gutter = 14;
      const nextLeft = clamp(desired, gutter, window.innerWidth - panelSize.width - gutter);
      setPanelLeft(nextLeft);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isMounted, panelSize.height, panelSize.width, renderedId]);

  const isOpen = isMounted && shouldBeOpen && Boolean(renderedItems.length);

  const handleBlurCapture = onPanelLeave
    ? (event: React.FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget;
        if (next && event.currentTarget.contains(next as Node)) return;
        onPanelLeave();
      }
    : undefined;

  if (!isMounted || !renderedId || renderedItems.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[58]",
        "motion-reduce:transition-none motion-reduce:duration-0",
      )}
      style={{ top: "var(--header-height)" }}
      aria-hidden={!isOpen}
    >
      {/* фон под меню: даёт Apple-подобное ощущение "слоя" */}
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onRequestClose}
        tabIndex={-1}
        className={cn(
          "absolute inset-0",
          "bg-background/0 backdrop-blur-0",
          "transition-[background-color,backdrop-filter,opacity] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          "motion-reduce:transition-none motion-reduce:duration-0",
          isOpen
            ? "opacity-100 bg-background/15 backdrop-blur-[2px]"
            : "pointer-events-none opacity-0",
        )}
      />

      <div
        ref={panelRef}
        onPointerEnter={onPanelEnter}
        onPointerLeave={onPanelLeave}
        onFocusCapture={onPanelEnter}
        onBlurCapture={handleBlurCapture}
        className={cn(
          "absolute",
          "mt-3",
          "rounded-2xl border border-[color:var(--header-border)] bg-background/92 backdrop-blur-md",
          "shadow-[0_24px_70px_rgba(0,0,0,0.16)]",
          "overflow-hidden",
          "transition-[opacity,transform,width,height,left] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          "motion-reduce:transition-none motion-reduce:duration-0",
          isOpen
            ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
            : "pointer-events-none opacity-0 -translate-y-2 scale-[0.98]",
        )}
        style={{ left: `${panelLeft}px`, width: `${panelSize.width}px`, height: `${panelSize.height}px` }}
      >
        <div
          ref={contentRef}
          className={cn(
            "p-3",
            "transition-[opacity,transform] duration-[240ms] ease-out",
            "motion-reduce:transition-none motion-reduce:duration-0",
          )}
          key={renderedId}
        >
          <ul className="m-0 list-none space-y-1 p-0">
            {renderedItems.map((item) => {
              const href = resolveHref(item.href);
              const normalizedHref = normalizePathname(href);
              const isActive =
                !item.isExternal &&
                (normalizedHref === normalizedCurrent ||
                  (normalizedHref !== "/" &&
                    normalizedCurrent.startsWith(`${normalizedHref}/`)));

              const linkClassName = cn(
                "group flex w-full items-center justify-between rounded-xl px-3",
                "h-11",
                "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
                "no-underline transition-colors",
                "active:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                isActive
                  ? "bg-muted/60 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
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
        </div>
      </div>
    </div>
  );
}
