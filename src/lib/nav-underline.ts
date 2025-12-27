import { cn } from "@/lib/cn";

type NavUnderlineVariant = "header" | "menu";

const VARIANT: Record<NavUnderlineVariant, { wrapper: string; offset: string }> = {
  header: {
    wrapper: "relative inline-flex h-full items-center",
    offset: "after:bottom-0",
  },
  menu: {
    wrapper: "relative inline-block",
    offset: "after:-bottom-1",
  },
};

export function navUnderlineSpanClass(active: boolean, variant: NavUnderlineVariant) {
  const v = VARIANT[variant];

  return cn(
    v.wrapper,
    "after:absolute after:left-0 after:right-0 after:rounded-full",
    v.offset,
    "after:origin-left after:transition-[transform,background-color] after:duration-200 after:ease-out",
    active
      ? cn(
          "after:h-[var(--nav-underline-h-active)]",
          "after:bg-current after:scale-x-100",
          "group-hover:after:bg-current group-focus-visible:after:bg-current",
        )
      : cn(
          "after:h-[var(--nav-underline-h)]",
          "after:bg-transparent after:scale-x-0",
          "group-hover:after:bg-[color:var(--header-border)] group-focus-visible:after:bg-[color:var(--header-border)]",
          "group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100",
        ),
  );
}