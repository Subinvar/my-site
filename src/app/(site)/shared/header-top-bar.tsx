"use client";

import Link from "next/link";
import {
  memo,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import type { SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

type HeaderTopSlotProps = {
  id: string;
  className?: string;
  children: ReactNode;
  stableSlots?: Record<string, number>;
};

type HeaderTopPillLinkProps = {
  href: string;
  label: string;
  pillBase: string;
  target?: string;
  rel?: string;
};

type HeaderCtaProps = {
  href: string;
  label: string;
  className?: string;
  children?: ReactNode;
  headerButtonBase: string;
};

type HeaderTopBarProps = {
  contacts: SiteContent["contacts"];
  isBurgerMode: boolean;
  isBurgerContactsNarrow: boolean;
  telegramHref: string;
  telegramLabel: string;
  onBurgerContactsNarrowChange?: (next: boolean) => void;
  hasTopContacts: boolean;
  topContactsWidth: number;
  topWagonsCollapsed: boolean;
  topWagonIsBurger: boolean;
  topWagonTransformClass: string;
  topWagonWidthTransitionClass: string;
  wagonTransitionClass: string;
  slideTransitionClass: string;
  burgerDelayClass: string;
  menuSlideClass: string;
  burgerSlideClass: string;
  inertProps: (enabled: boolean) => HTMLAttributes<HTMLElement>;
  hasHydrated: boolean;
  contactsHref: string;
  ctaLabel: string;
  locale: Locale;
  targetLocale: Locale;
  switcherHref: string | null;
  switchToLabels: Record<string, string>;
  classNames: {
    headerButtonBase: string;
    pillBase: string;
  };
};

export const HEADER_TOP_STABLE_SLOTS: Record<string, number> = {
  phone: 156,
  email: 140,
  theme: 40,
  lang: 40,
  cta: 200,
};

function HeaderTopSlot({
  id,
  className,
  children,
  stableSlots = HEADER_TOP_STABLE_SLOTS,
}: HeaderTopSlotProps) {
  const slotWidth = stableSlots[id];

  return (
    <div
      data-header-top-slot={id}
      className={cn(
        slotWidth ? "flex flex-none justify-end" : "inline-flex",
        // важно: min-w-0 + overflow-hidden позволяют truncate реально работать
        "h-10 min-w-0 items-center overflow-hidden",
        className,
      )}
      style={slotWidth ? ({ width: `${slotWidth}px` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

function HeaderTopPillLink({ href, label, pillBase, target, rel }: HeaderTopPillLinkProps) {
  return (
    <a
      href={href}
      className={cn(pillBase)}
      title={label}
      target={target}
      rel={rel}
    >
      {label}
    </a>
  );
}

export const HeaderCta = memo(function HeaderCta({
  href,
  label,
  className,
  children,
  headerButtonBase,
}: HeaderCtaProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        headerButtonBase,
        "group h-10 justify-center px-4",
        "whitespace-nowrap",
        "text-muted-foreground hover:text-foreground",
        "no-underline hover:no-underline",
        "hover:bg-background/80",
        "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="relative mr-2.5 inline-flex h-3.5 w-3.5 items-center justify-center"
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-[rgba(148,27,32,0.12)] blur-[0.5px]",
            "will-change-[transform,opacity,filter]",
            "animate-cta-glow motion-reduce:animate-none",
          )}
        />
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            "border border-[rgba(148,27,32,0.35)]",
            "will-change-[transform,opacity,filter]",
            "animate-cta-ring motion-reduce:animate-none",
          )}
        />
        <span
          className={cn(
            "relative h-2.5 w-2.5 overflow-hidden rounded-full",
            "shadow-[0_0_0_1.5px_rgba(148,27,32,0.20),0_0_10px_rgba(148,27,32,0.16)]",
            "will-change-[transform,opacity,filter]",
            "animate-cta-dot motion-reduce:animate-none",
          )}
        >
          <span
            className={cn(
              "absolute inset-0 rounded-full",
              "bg-[radial-gradient(circle_at_center,var(--color-brand-600)_0%,var(--color-brand-600)_54%,#a8242c_74%,#d88993_86%,#f7d5dc_100%)]",
              "after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.08)_72%,transparent_100%)] after:content-['']",
            )}
          />
          <span
            className={cn(
              "absolute inset-0 rounded-full",
              "bg-[radial-gradient(circle_at_center,transparent_0%,transparent_66%,rgba(247,213,220,0.00)_70%,rgba(247,213,220,0.40)_82%,rgba(247,213,220,0.78)_96%,transparent_100%)]",
              "blur-[0.2px]",
              "will-change-[transform,opacity,filter]",
              "animate-cta-inner-ring motion-reduce:animate-none",
            )}
          />
        </span>
      </span>
      {children ?? label}
    </Link>
  );
});

export const HeaderTopBar = memo(function HeaderTopBar({
  contacts,
  isBurgerMode,
  isBurgerContactsNarrow,
  telegramHref,
  telegramLabel,
  onBurgerContactsNarrowChange,
  hasTopContacts,
  topContactsWidth,
  topWagonsCollapsed,
  topWagonIsBurger,
  topWagonTransformClass,
  topWagonWidthTransitionClass,
  wagonTransitionClass,
  slideTransitionClass,
  burgerDelayClass,
  menuSlideClass,
  burgerSlideClass,
  inertProps,
  hasHydrated,
  contactsHref,
  ctaLabel,
  locale,
  targetLocale,
  switcherHref,
  switchToLabels,
  classNames,
}: HeaderTopBarProps) {
  const { headerButtonBase, pillBase } = classNames;

  const topBarRef = useRef<HTMLDivElement | null>(null);

  const hasPhone = Boolean(contacts.phone);
  const hasTelegram = telegramHref.trim().length > 0;

  const burgerContactsVisible = isBurgerMode && hasPhone;

  const telegramSlotWidth = HEADER_TOP_STABLE_SLOTS.email;
  const burgerPairWidth = HEADER_TOP_STABLE_SLOTS.phone + telegramSlotWidth + 8; // gap-2
  const burgerContactsSlotWidth = burgerContactsVisible
    ? hasTelegram && !isBurgerContactsNarrow
      ? burgerPairWidth
      : HEADER_TOP_STABLE_SLOTS.phone
    : 0;

  const rightControlsGapClass = burgerContactsVisible ? "gap-3" : "gap-9";

  // Второй порог: если становится слишком узко для (телефон + Telegram) слева от ThemeToggle,
  // то Telegram уезжает в бургер-меню, а сверху остаётся только телефон.
  useLayoutEffect(() => {
    if (!isBurgerMode) return;
    if (!hasPhone) return;
    if (!hasTelegram) {
      onBurgerContactsNarrowChange?.(false);
      return;
    }
    if (!onBurgerContactsNarrowChange) return;

    const node = topBarRef.current;
    if (!node) return;

    const RIGHT_GAP_PX = 12; // gap-3 (между блоком контактов и кнопками theme/lang)
    const pairRightControlsWidth =
      burgerPairWidth +
      HEADER_TOP_STABLE_SLOTS.theme +
      HEADER_TOP_STABLE_SLOTS.lang +
      RIGHT_GAP_PX * 2;

    const HYSTERESIS_PX = 24;

    const readGapPx = () => {
      const styles = window.getComputedStyle(node);
      const raw = styles.columnGap || styles.gap || "0";
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? value : 0;
    };

    const recalc = () => {
      const width = Math.round(node.getBoundingClientRect().width);
      const rootGapPx = readGapPx();
      const threshold = Math.round(rootGapPx + pairRightControlsWidth);
      const nextIsNarrow = isBurgerContactsNarrow
        ? width < threshold + HYSTERESIS_PX
        : width < threshold;
      onBurgerContactsNarrowChange(nextIsNarrow);
    };

    recalc();

    const ro = new ResizeObserver(recalc);
    ro.observe(node);
    return () => ro.disconnect();
  }, [
    burgerPairWidth,
    hasPhone,
    hasTelegram,
    isBurgerContactsNarrow,
    isBurgerMode,
    onBurgerContactsNarrowChange,
  ]);

  return (
    <div
      ref={topBarRef}
      className={cn(
        "flex h-full w-full min-w-0 max-w-full items-center rounded-lg",
        "gap-4 lg:gap-9",
        "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
      )}
    >
      <div className={cn("flex min-w-0 flex-1 items-center justify-end", "gap-4 lg:gap-9")}>
      {hasTopContacts ? (
        <div
          className={cn(
            "relative hidden h-10 flex-none overflow-hidden lg:block",
            topWagonWidthTransitionClass,
            "motion-reduce:transition-none motion-reduce:duration-0",
          )}
          style={{ width: topWagonsCollapsed ? 0 : `${topContactsWidth}px` } as CSSProperties}
        >
          <div
            className={cn(
              "absolute inset-0 h-[200%] w-full will-change-transform transform-gpu",
              wagonTransitionClass,
              "motion-reduce:transition-none motion-reduce:duration-0",
              topWagonTransformClass,
            )}
          >
            <div
              aria-hidden={hasHydrated ? topWagonIsBurger : undefined}
              {...inertProps(hasHydrated ? topWagonIsBurger : false)}
              className={cn(
                "flex h-1/2 w-full items-center gap-9",
                slideTransitionClass,
                "motion-reduce:transition-none motion-reduce:duration-0",
                menuSlideClass,
              )}
            >
              {contacts.phone ? (
                <HeaderTopSlot id="phone" className="hidden lg:inline-flex">
                  <HeaderTopPillLink
                    href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}
                    label={contacts.phone}
                    pillBase={pillBase}
                  />
                </HeaderTopSlot>
              ) : null}

              {contacts.email ? (
                <HeaderTopSlot id="email" className="hidden lg:inline-flex">
                  <HeaderTopPillLink
                    href={`mailto:${contacts.email}`}
                    label={contacts.email}
                    pillBase={pillBase}
                  />
                </HeaderTopSlot>
              ) : null}
            </div>

            <div
              aria-hidden={hasHydrated ? !topWagonIsBurger : undefined}
              {...inertProps(hasHydrated ? !topWagonIsBurger : false)}
              className={cn(
                "flex h-1/2 w-full items-center gap-9",
                slideTransitionClass,
                burgerDelayClass,
                "motion-reduce:transition-none motion-reduce:duration-0 motion-reduce:delay-0",
                burgerSlideClass,
              )}
            >
              {/* пусто намеренно */}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative hidden h-10 flex-none overflow-hidden lg:block",
          topWagonWidthTransitionClass,
          "motion-reduce:transition-none motion-reduce:duration-0",
        )}
        style={{ width: topWagonsCollapsed ? 0 : HEADER_TOP_STABLE_SLOTS.cta } as CSSProperties}
      >
        <div
          className={cn(
            "absolute inset-0 h-[200%] w-full will-change-transform transform-gpu",
            wagonTransitionClass,
            "motion-reduce:transition-none motion-reduce:duration-0",
            topWagonTransformClass,
          )}
        >
          <div
            aria-hidden={hasHydrated ? topWagonIsBurger : undefined}
            {...inertProps(hasHydrated ? topWagonIsBurger : false)}
            className={cn(
              "flex h-1/2 w-full items-center justify-end",
              slideTransitionClass,
              "motion-reduce:transition-none motion-reduce:duration-0",
              menuSlideClass,
            )}
          >
            <HeaderCta
              headerButtonBase={headerButtonBase}
              href={contactsHref}
              label={ctaLabel}
              className="w-full"
            />
          </div>

          <div
            aria-hidden={hasHydrated ? !topWagonIsBurger : undefined}
            {...inertProps(hasHydrated ? !topWagonIsBurger : false)}
            className={cn(
              "flex h-1/2 w-full items-center justify-end",
              slideTransitionClass,
              burgerDelayClass,
              "motion-reduce:transition-none motion-reduce:duration-0 motion-reduce:delay-0",
              burgerSlideClass,
            )}
          >
            {/* пусто намеренно */}
          </div>
        </div>
      </div>
      </div>
      <div className={cn("flex flex-none items-center", rightControlsGapClass)}>
        {hasPhone ? (
          <div
            aria-hidden={hasHydrated ? !burgerContactsVisible : undefined}
            {...inertProps(hasHydrated ? !burgerContactsVisible : false)}
            className="relative h-10 flex-none overflow-hidden"
            style={{ width: burgerContactsSlotWidth } as CSSProperties}
          >
            <div
              className={cn(
                "absolute inset-0",
                slideTransitionClass,
                burgerDelayClass,
                "motion-reduce:transition-none motion-reduce:duration-0 motion-reduce:delay-0",
                burgerContactsVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2",
              )}
            >
              <div
                className={cn(
                  "h-[200%] w-full will-change-transform transform-gpu",
                  wagonTransitionClass,
                  hasTelegram && isBurgerContactsNarrow ? "-translate-y-1/2" : "translate-y-0",
                )}
              >
                {/* Stage 1: телефон + Telegram */}
                <div className="flex h-1/2 w-full items-center gap-2">
                  <div className="flex flex-none" style={{ width: `${HEADER_TOP_STABLE_SLOTS.phone}px` }}>
                    <HeaderTopPillLink
                      href={`tel:${contacts.phone!.replace(/[^+\d]/g, "")}`}
                      label={contacts.phone!}
                      pillBase={pillBase}
                    />
                  </div>

                  {hasTelegram ? (
                    <div className="flex flex-none" style={{ width: `${telegramSlotWidth}px` }}>
                      <HeaderTopPillLink
                        href={telegramHref}
                        label={telegramLabel}
                        pillBase={pillBase}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Stage 2: только телефон */}
                <div className="flex h-1/2 w-full items-center">
                  <HeaderTopPillLink
                    href={`tel:${contacts.phone!.replace(/[^+\d]/g, "")}`}
                    label={contacts.phone!}
                    pillBase={pillBase}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <HeaderTopSlot id="theme">
          <ThemeToggle locale={locale} />
        </HeaderTopSlot>

        <HeaderTopSlot id="lang">
          <LanguageSwitcher
            currentLocale={locale}
            targetLocale={targetLocale}
            href={switcherHref}
            switchToLabels={switchToLabels}
          />
        </HeaderTopSlot>
      </div>
    </div>
  );
});

