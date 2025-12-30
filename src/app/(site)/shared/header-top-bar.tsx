"use client";

import Link from "next/link";
import { memo, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import type { SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

import { HeaderWagon, useDelayedCollapse } from "./header-wagon";
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
  hasTopContacts: boolean;
  topContactsWidth: number;

  isBurgerMode: boolean;
  prefersReducedMotion: boolean;

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

function HeaderTopPillLink({ href, label, pillBase }: HeaderTopPillLinkProps) {
  return (
    <a href={href} className={cn(pillBase)} title={label}>
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
        "text-muted-foreground hover:text-foreground",
        "no-underline hover:no-underline",
        "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
        className,
      )}
    >
      <span aria-hidden="true" className="relative mr-2.5 inline-flex h-3.5 w-3.5 items-center justify-center">
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
  hasTopContacts,
  topContactsWidth,
  isBurgerMode,
  prefersReducedMotion,
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

  // На SSR/до гидрации мы не знаем точный isBurgerMode (он может зависеть от измерений).
  // Но сам HeaderWagon имеет SSR-fallback через media-классы, поэтому
  // showSecondary можно прокидывать всегда, а вот «схлопывание ширины»
  // контролируем только после гидрации (в useDelayedCollapse).
  const shouldHideTopWagons = isBurgerMode;

  // Схлопываем ширину ПОСЛЕ завершения exit-анимации (иначе будет «моментальное исчезновение»).
  const topWagonsCollapsed = useDelayedCollapse(shouldHideTopWagons, {
    delayMs: 640,
    hasHydrated,
    prefersReducedMotion,
  });

  // Ширину анимируем только при *схлопывании* (desktop -> burger),
  // а при обратном переходе (burger -> desktop) делаем мгновенно,
  // чтобы вагоны не «вылетали из правого нижнего угла».
  const widthTransitionClass =
    hasHydrated && !prefersReducedMotion && shouldHideTopWagons
      ? "transition-[width] duration-400 ease-out"
      : "transition-none";

  const topContactsSsrWidthStyle =
    hasHydrated ? undefined : ({ "--top-contacts-w": `${topContactsWidth}px` } as CSSProperties);

  return (
    <div className="flex h-full w-full min-w-0 max-w-full items-center gap-9 rounded-lg text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-9">
        {hasTopContacts ? (
          <div
            className={cn(
              "relative h-10 overflow-hidden",
              // SSR: на mobile ширина 0, на lg+ — вычисленная ширина.
              hasHydrated ? "" : "w-0 lg:w-[var(--top-contacts-w)]",
              widthTransitionClass,
              "motion-reduce:transition-none motion-reduce:duration-0",
            )}
            style={
              hasHydrated
                ? ({ width: topWagonsCollapsed ? 0 : `${topContactsWidth}px` } as CSSProperties)
                : topContactsSsrWidthStyle
            }
          >
            <HeaderWagon
              showSecondary={shouldHideTopWagons}
              hasHydrated={hasHydrated}
              inertProps={inertProps}
              prefersReducedMotion={prefersReducedMotion}
              durationMs={640}
              panelBaseClassName="flex h-full w-full items-center gap-9"
              primary={
                <>
                  {contacts.phone ? (
                    <HeaderTopSlot id="phone">
                      <HeaderTopPillLink
                        href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}
                        label={contacts.phone}
                        pillBase={pillBase}
                      />
                    </HeaderTopSlot>
                  ) : null}

                  {contacts.email ? (
                    <HeaderTopSlot id="email">
                      <HeaderTopPillLink href={`mailto:${contacts.email}`} label={contacts.email} pillBase={pillBase} />
                    </HeaderTopSlot>
                  ) : null}
                </>
              }
              secondary={null}
            />
          </div>
        ) : null}

        <div
          className={cn(
            "relative h-10 overflow-hidden",
            // SSR: на mobile ширина 0, на lg+ — фиксированная.
            hasHydrated ? "" : "w-0 lg:w-[200px]",
            widthTransitionClass,
            "motion-reduce:transition-none motion-reduce:duration-0",
          )}
          style={
            hasHydrated
              ? ({ width: topWagonsCollapsed ? 0 : HEADER_TOP_STABLE_SLOTS.cta } as CSSProperties)
              : undefined
          }
        >
          <HeaderWagon
            showSecondary={shouldHideTopWagons}
            hasHydrated={hasHydrated}
            inertProps={inertProps}
            prefersReducedMotion={prefersReducedMotion}
            durationMs={640}
            panelBaseClassName="flex h-full w-full items-center justify-end"
            primary={
              <HeaderCta
                headerButtonBase={headerButtonBase}
                href={contactsHref}
                label={ctaLabel}
                className="w-full"
              />
            }
            secondary={null}
          />
        </div>
      </div>

      <div className="flex flex-none items-center gap-9">
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
