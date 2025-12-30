"use client";

import {
  memo,
  type HTMLAttributes,
  type RefObject,
} from "react";

import { NavigationList } from "@/app/[locale]/navigation-list";
import type { Locale } from "@/lib/i18n";
import type { Navigation, NavigationLink } from "@/lib/keystatic";
import { cn } from "@/lib/cn";
import { focusRingBase } from "@/lib/focus-ring";

import { HeaderCta } from "./header-top-bar";

type HeaderNavProps = {
  navHostRef?: RefObject<HTMLDivElement | null>;
  navMeasureRef?: RefObject<HTMLDivElement | null>;
  navigation: Navigation;
  navigationLabel: string;
  locale: Locale;
  currentPath: string;
  isBurgerMode: boolean;
  hasHydrated: boolean;
  isMenuOpen: boolean;
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
  headerButtonBase: string;
  onDesktopNavEnter?: () => void;
  onDesktopNavLeave?: () => void;
  onDesktopNavLinkEnter?: (link: NavigationLink) => void;
  onDesktopNavLinkFocus?: (link: NavigationLink) => void;
};

export const HeaderNav = memo(function HeaderNav({
  navHostRef,
  navMeasureRef,
  navigation,
  navigationLabel,
  locale,
  currentPath,
  isBurgerMode,
  hasHydrated,
  isMenuOpen,
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
  headerButtonBase,
  onDesktopNavEnter,
  onDesktopNavLeave,
  onDesktopNavLinkEnter,
  onDesktopNavLinkFocus,
}: HeaderNavProps) {
  const burgerAriaLabel = locale === "ru"
    ? isMenuOpen
      ? "Закрыть меню"
      : "Открыть меню"
    : isMenuOpen
      ? "Close menu"
      : "Open menu";

  return (
    <div
      ref={navHostRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg",
        "h-[var(--header-row-bottom-h)]",
        "lg:h-full lg:min-h-[var(--header-row-bottom-h)]",
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
            className="w-full max-w-[var(--header-rail-w)]"
            density="compact"
            distribution="between"
            onNavEnter={onDesktopNavEnter}
            onNavLeave={onDesktopNavLeave}
            onLinkEnter={onDesktopNavLinkEnter}
            onLinkFocus={onDesktopNavLinkFocus}
          />
        </div>

        <div
          aria-hidden={hasHydrated ? !isBurgerMode : undefined}
          {...inertProps(hasHydrated ? !isBurgerMode : false)}
          className={cn(
            "flex h-1/2 w-full items-center gap-3",
            slideTransitionClass,
            burgerDelayClass,
            "motion-reduce:transition-none motion-reduce:duration-0 motion-reduce:delay-0",
            burgerSlideClass,
          )}
        >
          <div className="flex h-full flex-1 items-center justify-end">
            <div data-header-nav-buttons className="flex items-center gap-3">
              <HeaderCta
                headerButtonBase={headerButtonBase}
                href={contactsHref}
                label={ctaLabel}
                className={cn(
                  "h-10 min-w-[180px] max-w-[260px] justify-center",
                  "whitespace-nowrap",
                )}
              />

              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-controls="site-menu"
                aria-label={burgerAriaLabel}
                onClick={onBurgerClick}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl border",
                  "transition-colors duration-150",
                  isMenuOpen
                    ? "border-[color:var(--header-border)] bg-background/70 text-foreground"
                    : "border-transparent bg-transparent text-muted-foreground",
                  "hover:border-[color:var(--header-border)] hover:text-foreground",
                  focusRingBase,
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
              </button>
            </div>
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
            distribution="between"
            measureMode
          />
        </div>
      ) : null}
    </div>
  );
});

