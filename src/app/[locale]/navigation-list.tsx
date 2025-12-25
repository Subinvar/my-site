import Link from "next/link";
import type React from "react";

import { cn } from "@/lib/cn";
import type { NavigationLink } from "@/lib/keystatic";

type NavigationListProps = {
  links: NavigationLink[];
  ariaLabel?: string | null;
  currentPath?: string;
  className?: string;
  density?: "default" | "compact";
  stableSlots?: Record<string, number>;
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
}: NavigationListProps) {
  if (!links.length) {
    return null;
  }

  const normalizedCurrent = normalizePathname(currentPath);
  const label = ariaLabel?.trim() ?? "";
  const resolvedLabel = label.length > 0 ? label : undefined;

  const listClassName =
    density === "compact"
      ? "m-0 p-0 list-none flex flex-wrap lg:flex-nowrap items-center justify-end gap-6"
      : "m-0 p-0 list-none flex flex-wrap lg:flex-nowrap items-center justify-end gap-6 text-sm font-medium";

  const densityClass =
    density === "compact"
      ? "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]"
      : "text-[clamp(0.99rem,0.935rem+0.33vw,1.21rem)] font-medium";

  const underlineOffsetClass =
    density === "compact" ? "after:bottom-0" : "after:-bottom-0.5";
  const underlinePadClass = density === "compact" ? "pb-3" : "";
  const linkHeightClass = density === "compact" ? "h-10" : "";

  const labelUnderlineBaseClassName = cn(
    "relative inline-block",
    underlinePadClass,
    "after:absolute after:left-0 after:right-0 after:h-px after:rounded-full",
    underlineOffsetClass,
    "after:origin-left after:transition-[transform,background-color] after:duration-200 after:ease-out",
  );

  const labelInnerClassName = cn(
    labelUnderlineBaseClassName,
    // старт: линии нет
    "after:bg-transparent after:scale-x-0",
    // hover/focus: линия появляется и по цвету = border (как у Theme/Language toggle)
    "group-hover:after:bg-[var(--header-border)] group-focus-visible:after:bg-[var(--header-border)]",
    "group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100",
  );

  const activeLabelInnerClassName = cn(
    labelUnderlineBaseClassName,
    // активная страница: линия всегда видна и тёмная (в цвет текста пункта)
    "after:scale-x-100 after:bg-current",
    // и не перекрашиваем её в серую на hover/focus
    "group-hover:after:bg-current group-focus-visible:after:bg-current",
  );

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

          const liClassName = cn(isStableSlot && "flex flex-none");
          const liStyle = isStableSlot
            ? ({ width: `${slotWidth}px` } as React.CSSProperties)
            : undefined;

          const linkClassName = cn(
            isStableSlot ? "flex w-full justify-end" : "inline-flex",
            "group",
            linkHeightClass,
            "items-center gap-1",
            densityClass,
            "active:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
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
                      isActive ? activeLabelInnerClassName : labelInnerClassName
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
                    isActive ? activeLabelInnerClassName : labelInnerClassName
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
