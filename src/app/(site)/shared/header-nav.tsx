"use client";

import { memo, type HTMLAttributes, type RefObject } from "react";

import { NavigationList } from "@/app/[locale]/navigation-list";
import type { Locale } from "@/lib/i18n";
import type { Navigation, NavigationLink } from "@/lib/keystatic";
import { cn } from "@/lib/cn";
import { focusRingBase } from "@/lib/focus-ring";

import { HeaderWagon } from "./header-wagon";
import { HeaderCta } from "./header-top-bar";

type HeaderNavProps = {
  navHostRef?: RefObject<HTMLDivElement | null>;
  navMeasureRef?: RefObject<HTMLDivElement | null>;
  navigation: Navigation;
  navigationLabel: string;
  locale: Locale;
  currentPath: string;

  /**
   * ID пункта десктопного меню, для которого сейчас открыто подменю.
   * Нужен для корректных aria-expanded/aria-controls у триггеров.
   */
  desktopDropdownId?: string | null;

  isBurgerMode: boolean;
  prefersReducedMotion: boolean;
  hasHydrated: boolean;

  isMenuOpen: boolean;
  onBurgerClick: () => void;

  topLineTransform: string;
  bottomLineTransform: string;

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
  desktopDropdownId,
  isBurgerMode,
  prefersReducedMotion,
  hasHydrated,
  isMenuOpen,
  onBurgerClick,
  topLineTransform,
  bottomLineTransform,
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
      <HeaderWagon
        showSecondary={isBurgerMode}
        hasHydrated={hasHydrated}
        inertProps={inertProps}
        prefersReducedMotion={prefersReducedMotion}
        durationMs={640}
        primaryEnterFrom="top"
        secondaryExitTo="bottom"
        panelBaseClassName="flex h-full w-full items-center"
        primaryClassName="justify-end"
        secondaryClassName="justify-end gap-3"
        primary={
          <NavigationList
            links={navigation.header}
            ariaLabel={navigationLabel}
            currentPath={currentPath}
            expandedId={desktopDropdownId}
            className="w-full max-w-[var(--header-rail-w)]"
            density="compact"
            distribution="between"
            onNavEnter={onDesktopNavEnter}
            onNavLeave={onDesktopNavLeave}
            onLinkEnter={onDesktopNavLinkEnter}
            onLinkFocus={onDesktopNavLinkFocus}
          />
        }
        secondary={
          <div className="flex h-full flex-1 items-center justify-end gap-3">
            <HeaderCta
              headerButtonBase={headerButtonBase}
              href={contactsHref}
              label={ctaLabel}
              className="hidden h-10 w-[216px] justify-center lg:inline-flex"
            />

            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="site-menu"
              aria-label={burgerAriaLabel}
              onClick={onBurgerClick}
              className={cn(
                // ✅ Фикс "съеденных 1px": border прозрачный, обводка внутри через after:inset-px.
                "relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-transparent bg-transparent",
                "after:pointer-events-none after:absolute after:inset-px after:rounded-[11px] after:border after:border-transparent after:content-['']",
                "cursor-pointer",
                "text-muted-foreground transition-colors duration-150",
                "after:transition-colors after:duration-150 after:ease-out",
                isMenuOpen
                  ? "bg-background/70 text-foreground after:border-current"
                  : "bg-transparent",
                "hover:bg-transparent hover:text-foreground hover:after:border-current",
                "focus-visible:after:border-current",
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
        }
      />

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
            expandedId={desktopDropdownId}
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
