"use client";

import { memo, type HTMLAttributes, type RefObject } from "react";

import { NavigationList } from "@/app/[locale]/navigation-list";
import type { Navigation } from "@/lib/keystatic";
import { cn } from "@/lib/cn";

import { HeaderCta } from "./header-top-bar";

type HeaderNavProps = {
  navHostRef?: RefObject<HTMLDivElement | null>;
  navMeasureRef?: RefObject<HTMLDivElement | null>;
  navigation: Navigation;
  navigationLabel: string;
  currentPath: string;
  isBurgerMode: boolean;
  hasHydrated: boolean;
  isMenuOpen: boolean;
  openMenuLabel: string;
  closeMenuLabel: string;
  onBurgerClick: () => void;
  topLineTransform: string;
  bottomLineTransform: string;
  wagonTransitionClass: string;
  wagonTransformClass: string;
  slideTransitionClass: string;
  menuSlideClass: string;
  burgerSlideClass: string;
  burgerDelayClass: string;
  inertProps: (enabled: boolean) => HTMLAttributes<HTMLElement>;
  contactsHref: string;
  ctaLabel: string;
};

export const HEADER_NAV_STABLE_SLOTS: Record<string, number> = {
  products: 116,
  news: 96,
  about: 124,
  partners: 120,
  contacts: 120,
};

export const HeaderNav = memo(function HeaderNav({
  navHostRef,
  navMeasureRef,
  navigation,
  navigationLabel,
  currentPath,
  isBurgerMode,
  hasHydrated,
  isMenuOpen,
  openMenuLabel,
  closeMenuLabel,
  onBurgerClick,
  topLineTransform,
  bottomLineTransform,
  wagonTransitionClass,
  wagonTransformClass,
  slideTransitionClass,
  menuSlideClass,
  burgerSlideClass,
  burgerDelayClass,
  inertProps,
  contactsHref,
  ctaLabel,
}: HeaderNavProps) {
  return (
    <div
      ref={navHostRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg",
        "h-11",
        "lg:h-full lg:min-h-[44px]",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 h-[200%] w-full will-change-transform transform-gpu",
          wagonTransitionClass,
          "motion-reduce:transition-none motion-reduce:duration-0",
          wagonTransformClass,
        )}
      >
        <div
          aria-hidden={hasHydrated ? isBurgerMode : undefined}
          {...inertProps(hasHydrated ? isBurgerMode : false)}
          className={cn(
            "flex h-1/2 w-full items-center justify-end",
            slideTransitionClass,
            "motion-reduce:transition-none motion-reduce:duration-0",
            menuSlideClass,
          )}
        >
          <NavigationList
            links={navigation.header}
            ariaLabel={navigationLabel}
            currentPath={currentPath}
            className="hidden w-full justify-end gap-3 lg:flex"
            density="default"
          />
        </div>

        <div
          aria-hidden={hasHydrated ? !isBurgerMode : undefined}
          {...inertProps(hasHydrated ? !isBurgerMode : false)}
          className={cn(
            "flex h-1/2 w-full items-center justify-end gap-3",
            slideTransitionClass,
            burgerDelayClass,
            "motion-reduce:transition-none motion-reduce:duration-0 motion-reduce:delay-0",
            burgerSlideClass,
          )}
        >
          <div className="flex h-11 flex-1 items-center justify-end gap-3 lg:justify-between">
            <HeaderCta
              href={contactsHref}
              label={ctaLabel}
              className="hidden h-10 min-w-[180px] max-w-[260px] justify-center lg:inline-flex"
            />

            <button
              type="button"
              aria-pressed={isMenuOpen}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? closeMenuLabel : openMenuLabel}
              onClick={onBurgerClick}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[clamp(0.9rem,0.87rem+0.08vw,1rem)] font-medium leading-tight",
                "border border-[var(--header-border)] bg-background/70 text-foreground",
                "transition-colors duration-200 ease-out hover:border-[var(--header-border)] hover:bg-background/85",
                "focus-visible:border-[var(--header-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                "motion-reduce:transition-none motion-reduce:duration-0",
                isMenuOpen ? "bg-background/90" : "",
              )}
            >
              <span className="relative block h-4 w-5">
                <span
                  className="absolute left-1/2 top-1/2 h-[2px] w-full rounded-full bg-current transition-transform duration-200 motion-reduce:transition-none motion-reduce:duration-0"
                  style={{ transform: topLineTransform }}
                />
                <span
                  className="absolute left-1/2 top-1/2 h-[2px] w-full rounded-full bg-current transition-transform duration-200 motion-reduce:transition-none motion-reduce:duration-0"
                  style={{ transform: bottomLineTransform }}
                />
              </span>
              <span className="block">{isMenuOpen ? closeMenuLabel : openMenuLabel}</span>
            </button>
          </div>
        </div>
      </div>

      {navMeasureRef ? (
        <div
          ref={navMeasureRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 invisible inline-block w-max"
        >
          <NavigationList
            links={navigation.header}
            ariaLabel={navigationLabel}
            currentPath={currentPath}
            className="inline-block w-max"
            density="compact"
            stableSlots={HEADER_NAV_STABLE_SLOTS}
          />
        </div>
      ) : null}
    </div>
  );
});

