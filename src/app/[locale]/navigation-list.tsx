import Link from "next/link";
import type React from "react";

import { cn } from "@/lib/cn";
import { focusRingBase } from "@/lib/focus-ring";
import { navUnderlineSpanClass } from "@/lib/nav-underline";
import type { NavigationLink } from "@/lib/keystatic";

type NavigationListProps = {
  links: NavigationLink[];
  ariaLabel?: string | null;
  currentPath?: string;
  className?: string;
  density?: "default" | "compact";
  stableSlots?: Record<string, number>;
  layout?: "header" | "panel";
  distribution?: "end" | "between";
  measureMode?: boolean;
  /**
   * ID пункта, чьё подменю сейчас раскрыто (для aria-expanded).
   * Передавайте null/undefined, если подменю не используется.
   */
  expandedId?: string | null;

  /**
   * ID DOM-узла панели подменю (для aria-controls).
   * Должен совпадать с id на компоненте, который рендерит панель.
   */
  submenuPanelId?: string;
  onNavEnter?: () => void;
  onNavLeave?: () => void;
  onLinkEnter?: (link: NavigationLink) => void;
  onLinkFocus?: (link: NavigationLink) => void;
};

const normalizePathname = (value: string): string => {
  const [pathWithoutQuery] = value.split("?");
  const [path] = (pathWithoutQuery ?? "").split("#");
  const trimmed = (path ?? "/").replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
};

const resolveHref = (href: string): string => {
  const normalized = href.trim();
  return normalized.length ? normalized : "/";
};

export function NavigationList({
  links,
  ariaLabel,
  currentPath = "/",
  className,
  density = "default",
  stableSlots,
  layout = "header",
  distribution = "end",
  measureMode = false,
  expandedId,
  submenuPanelId,
  onNavEnter,
  onNavLeave,
  onLinkEnter,
  onLinkFocus,
}: NavigationListProps) {
  if (!links.length) {
    return null;
  }

  const normalizedCurrent = normalizePathname(currentPath);
  const label = ariaLabel?.trim() ?? "";
  const resolvedLabel = label.length > 0 ? label : undefined;

  const isPanel = layout === "panel";
  const isInteractive = !isPanel && !measureMode;

  const resolvedSubmenuPanelId = (submenuPanelId ?? "header-desktop-dropdown-panel").trim();
  const submenuPanelIdOrUndefined = resolvedSubmenuPanelId.length > 0
    ? resolvedSubmenuPanelId
    : undefined;

  const handleBlurCapture = isInteractive && onNavLeave
    ? (event: React.FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget;
        if (next && event.currentTarget.contains(next as Node)) return;
        onNavLeave();
      }
    : undefined;

  const betweenWidthClass = measureMode ? "w-max" : "w-full";

  const listClassName = isPanel
    ? "m-0 p-0 list-none flex flex-col gap-1"
    : density === "compact"
      ? distribution === "between"
        ? cn(
            "m-0 p-0 list-none flex flex-nowrap items-center justify-between gap-0",
            betweenWidthClass,
            "pl-[var(--header-nav-inset-x)] pr-[var(--header-nav-inset-x-end)]",
          )
        : "m-0 p-0 list-none flex flex-wrap lg:flex-nowrap items-center justify-end gap-6"
      : "m-0 p-0 list-none flex flex-wrap lg:flex-nowrap items-center justify-end gap-6 text-sm font-medium";

  const densityClass =
    density === "compact"
      ? "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]"
      : "text-[clamp(0.99rem,0.935rem+0.33vw,1.21rem)] font-medium";

  const linkHeightClass = isPanel ? "h-11" : density === "compact" ? "h-10" : "";

  return (
    <nav
      aria-label={resolvedLabel}
      className={className}
      onPointerEnter={isInteractive ? onNavEnter : undefined}
      onPointerLeave={isInteractive ? onNavLeave : undefined}
      onFocusCapture={isInteractive ? onNavEnter : undefined}
      onBlurCapture={handleBlurCapture}
    >
      <ul className={listClassName}>
        {links.map((link) => {
          const href = resolveHref(link.href);
          const normalizedHref = normalizePathname(href);
          const isChildActive =
            Array.isArray(link.children) &&
            link.children.some((child) => {
              if (child.isExternal) return false;
              const childHref = resolveHref(child.href);
              const normalizedChildHref = normalizePathname(childHref);
              return (
                normalizedChildHref === normalizedCurrent ||
                (normalizedChildHref !== "/" &&
                  normalizedCurrent.startsWith(`${normalizedChildHref}/`))
              );
            });

          const isActive =
            (!link.isExternal &&
              (normalizedHref === normalizedCurrent ||
                (normalizedHref !== "/" &&
                  normalizedCurrent.startsWith(`${normalizedHref}/`)))) ||
            Boolean(isChildActive);

          const slotWidth = stableSlots?.[link.id];
          const isStableSlot = typeof slotWidth === "number";

          const stableAlignClass = isStableSlot ? "flex w-full justify-center" : "";

          const shouldUseStableSlot = !isPanel && isStableSlot;

          const liClassName = cn(
            shouldUseStableSlot && "flex flex-none",
            isPanel && "w-full",
          );
          const liStyle = shouldUseStableSlot
            ? ({ width: `${slotWidth}px` } as React.CSSProperties)
            : undefined;

          const linkClassName = isPanel
            ? cn(
                "group flex w-full items-center justify-between rounded-lg px-3",
                linkHeightClass,
                densityClass,
                "no-underline transition-colors",
                "active:opacity-90",
                focusRingBase,
                isActive
                  ? "bg-muted/60 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )
            : cn(
                isStableSlot ? stableAlignClass : "inline-flex",
                "group",
                linkHeightClass,
                "items-center gap-1",
                "whitespace-nowrap",
                densityClass,
                "active:opacity-90",
                focusRingBase,
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              );


          const triggerId = isInteractive ? link.id : undefined;
          const hasChildren = Boolean(link.children?.length);

          const isExpanded = Boolean(
            isInteractive &&
              hasChildren &&
              expandedId &&
              expandedId === link.id,
          );

          // Mega-menu в шапке — это обычная навигация (<nav>/<ul>), а не ARIA menu widget.
          // Поэтому используем boolean aria-haspopup ("есть попап") вместо aria-haspopup="menu".
          const ariaHasPopup = isInteractive && hasChildren ? true : undefined;
          const ariaExpanded = isInteractive && hasChildren ? isExpanded : undefined;
          const ariaControls =
            isInteractive && hasChildren ? submenuPanelIdOrUndefined : undefined;

          if (link.isExternal) {
            return (
              <li key={link.id} className={liClassName} style={liStyle}>
                <a
                  href={href}
                  target={link.newTab ? "_blank" : undefined}
                  rel={link.newTab ? "noopener noreferrer" : undefined}
                  className={linkClassName}
                  aria-haspopup={ariaHasPopup}
                  aria-expanded={ariaExpanded}
                  aria-controls={ariaControls}
                  data-nav-trigger={triggerId}
                  data-nav-has-children={hasChildren ? "true" : undefined}
                  onPointerEnter={isInteractive ? () => onLinkEnter?.(link) : undefined}
                  onFocus={isInteractive ? () => onLinkFocus?.(link) : undefined}
                >
                  <span
                    className={
                      isPanel
                        ? "relative inline-block"
                        : navUnderlineSpanClass(isActive, "header")
                    }
                  >
                    {link.label}
                  </span>
                </a>
              </li>
            );
          }

          return (
            <li key={link.id} className={liClassName} style={liStyle}>
              <Link
                href={href}
                className={linkClassName}
                aria-current={isActive ? "page" : undefined}
                aria-haspopup={ariaHasPopup}
                aria-expanded={ariaExpanded}
                aria-controls={ariaControls}
                data-nav-trigger={triggerId}
                data-nav-has-children={hasChildren ? "true" : undefined}
                onPointerEnter={isInteractive ? () => onLinkEnter?.(link) : undefined}
                onFocus={isInteractive ? () => onLinkFocus?.(link) : undefined}
              >
                <span
                  className={
                    isPanel
                      ? "relative inline-block"
                      : navUnderlineSpanClass(isActive, "header")
                  }
                >
                  {link.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
