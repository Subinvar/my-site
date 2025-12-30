import { cn } from "@/lib/cn";

type NavUnderlineVariant = "header" | "menu" | "footer";

const VARIANT: Record<NavUnderlineVariant, { wrapper: string; offset: string }> = {
  header: {
    wrapper: "relative inline-flex h-full items-center",
    offset: "after:bottom-0",
  },
  footer: {
    wrapper: "relative inline-flex h-full items-center",
    offset: "after:bottom-0",
  },
  menu: {
    wrapper: "relative inline-flex h-full items-center",
    offset: "after:bottom-0",
  },
};

export function navUnderlineSpanClass(active: boolean, variant: NavUnderlineVariant) {
  const v = VARIANT[variant];

  return cn(
    v.wrapper,
    "after:absolute after:left-0 after:right-0 after:rounded-full",
    v.offset,
    "after:origin-left after:transition-[transform,opacity] after:duration-200 after:ease-out",
    active
      ? cn(
          "after:h-[var(--nav-underline-h-active,2px)]",
          "after:bg-current after:opacity-100 after:scale-x-100",
        )
      : cn(
          "after:h-[var(--nav-underline-h,1px)]",
          "after:bg-current after:opacity-0 after:scale-x-0",
          "group-hover:after:opacity-[var(--nav-underline-hover-opacity,0.5)] group-focus-visible:after:opacity-[var(--nav-underline-hover-opacity,0.5)]",
          "group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100",
        ),
  );
}