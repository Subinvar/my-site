import Link from "next/link";
import type React from "react";

import { cn } from "@/lib/cn";
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
}: NavigationListProps) {
  if (!links.length) {
    return null;
  }

  const normalizedCurrent = normalizePathname(currentPath);
  const label = ariaLabel?.trim() ?? "";
  const resolvedLabel = label.length > 0 ? label : undefined;

  const isPanel = layout === "panel";

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
    <nav aria-label={resolvedLabel} className={className}>
      <ul className={listClassName}>
        {links.map((link) => {
          const href = resolveHref(link.href);
          const normalizedHref = normalizePathname(href);
          const isActive =
            !link.isExternal &&
            (normalizedHref === normalizedCurrent ||
              (normalizedHref !== "/" &&
                normalizedCurrent.startsWith(`${normalizedHref}/`)));

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
                "group flex w-full items-center justify-between rounded-xl px-3",
                linkHeightClass,
                densityClass,
                "no-underline transition-colors",
                "active:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
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
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              );


          if (link.isExternal) {
            return (
              <li key={link.id} className={liClassName} style={liStyle}>
                <a
                  href={href}
                  target={link.newTab ? "_blank" : undefined}
                  rel={link.newTab ? "noopener noreferrer" : undefined}
                  className={linkClassName}
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
