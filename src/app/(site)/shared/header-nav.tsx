"use client";

import {
  memo,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type RefObject,
} from "react";

import { NavigationList } from "@/app/[locale]/navigation-list";
import type { Locale } from "@/lib/i18n";
import type { Navigation, NavigationLink, SiteContent } from "@/lib/keystatic";
import { cn } from "@/lib/cn";
import { focusRingBase } from "@/lib/focus-ring";

import { HeaderCta, HEADER_TOP_STABLE_SLOTS } from "./header-top-bar";

type HeaderNavProps = {
  navHostRef?: RefObject<HTMLDivElement | null>;
  navMeasureRef?: RefObject<HTMLDivElement | null>;
  navigation: Navigation;
  navigationLabel: string;
  locale: Locale;
  currentPath: string;
  isBurgerMode: boolean;
  showBottomContactsPair: boolean;
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
  pillBase: string;
  contacts: SiteContent["contacts"];
  telegramHref: string;
  telegramLabel: string;
  onBurgerContactsNarrowChange?: (isNarrow: boolean) => void;
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
  showBottomContactsPair,
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
  pillBase,
  contacts,
  telegramHref,
  telegramLabel,
  onBurgerContactsNarrowChange,
  onDesktopNavEnter,
  onDesktopNavLeave,
  onDesktopNavLinkEnter,
  onDesktopNavLinkFocus,
}: HeaderNavProps) {
  const burgerRowRef = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<HTMLDivElement | null>(null);

  const phoneWidth = contacts.phone ? HEADER_TOP_STABLE_SLOTS.phone : 0;
  const telegramWidth = telegramHref ? HEADER_TOP_STABLE_SLOTS.email : 0;
  const contactsGap = contacts.phone && telegramHref ? 8 : 0; // gap-2
  const contactsBlockWidth = phoneWidth + telegramWidth + contactsGap;

  // Второй порог (Stage 2): если места рядом с кнопками снизу не хватает для
  // (телефон + Telegram), переключаем раскладку:
  // - телефон → к ThemeToggle
  // - Telegram → в бургер-меню
  useLayoutEffect(() => {
    if (!onBurgerContactsNarrowChange) return;

    if (!isBurgerMode) {
      onBurgerContactsNarrowChange(false);
      return;
    }

    // Без обоих контактов второй порог не нужен.
    if (!contacts.phone || !telegramHref) {
      onBurgerContactsNarrowChange(false);
      return;
    }

    const row = burgerRowRef.current;
    const buttons = buttonsRef.current;
    if (!row || !buttons || typeof ResizeObserver === "undefined") return;

    const HYST = 24;
    const GROUP_GAP = 12; // gap-3 между блоком контактов и кнопками
    let raf = 0;

    const recalc = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const rowW = Math.round(row.getBoundingClientRect().width);
        const buttonsW = Math.round(buttons.getBoundingClientRect().width);
        if (!rowW || !buttonsW) return;

        const threshold = contactsBlockWidth + buttonsW + GROUP_GAP;
        const prevIsNarrow = isBurgerMode && !showBottomContactsPair;

        const nextIsNarrow = prevIsNarrow
          ? rowW < threshold + HYST
          : rowW < threshold;

        if (nextIsNarrow !== prevIsNarrow) {
          onBurgerContactsNarrowChange(nextIsNarrow);
        }
      });
    };

    const ro = new ResizeObserver(recalc);
    ro.observe(row);
    ro.observe(buttons);
    recalc();

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [
    contacts.phone,
    contactsBlockWidth,
    isBurgerMode,
    onBurgerContactsNarrowChange,
    showBottomContactsPair,
    telegramHref,
  ]);
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
          ref={burgerRowRef}
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
          <div
            aria-hidden={hasHydrated ? !showBottomContactsPair : undefined}
            {...inertProps(hasHydrated ? !showBottomContactsPair : false)}
            className={cn(
              "relative h-10 overflow-hidden",
              "transition-[width] duration-200 ease-out",
              "motion-reduce:transition-none motion-reduce:duration-0",
            )}
            style={{ width: showBottomContactsPair ? `${contactsBlockWidth}px` : "0px" }}
          >
            <div
              className={cn(
                "absolute inset-0 flex items-center gap-2",
                slideTransitionClass,
                "motion-reduce:transition-none motion-reduce:duration-0",
                showBottomContactsPair
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2",
              )}
            >
              {contacts.phone ? (
                <a
                  href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}
                  className={pillBase}
                  style={{ width: `${HEADER_TOP_STABLE_SLOTS.phone}px` }}
                >
                  {contacts.phone}
                </a>
              ) : null}

              {telegramHref ? (
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={pillBase}
                  style={{ width: `${HEADER_TOP_STABLE_SLOTS.email}px` }}
                >
                  {telegramLabel}
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex h-full flex-1 items-center justify-end">
            <div
              ref={buttonsRef}
              data-header-nav-buttons
              className="flex items-center gap-3"
            >
              <HeaderCta
                headerButtonBase={headerButtonBase}
                href={contactsHref}
                label={ctaLabel}
                className="hidden h-10 min-w-[180px] max-w-[260px] justify-center lg:inline-flex"
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

