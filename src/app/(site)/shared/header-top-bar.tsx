"use client";

import Link from "next/link";
import { memo, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import type { SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { formatTelegramHandle } from "@/lib/contacts";

import { HeaderWagon } from "./header-wagon";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

type HeaderTopSlotProps = {
  id: string;
  className?: string;
  children: ReactNode;
  stableSlots?: Record<string, number>;
};

type HeaderTopFlexSlotProps = {
  id: string;
  basisPx: number;
  className?: string;
  children: ReactNode;
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
  /** >= sm (640px). Ниже sm включаем сверх-узкий режим top-bar (phone-only). */
  isSmUp: boolean;
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
  telegram: 140,
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

// Mobile-слот: как обычный HeaderTopSlot, но вместо фиксированного width
// используем flex-basis + shrink, чтобы элементы могли сжиматься и не "врезались" в логотип.
function HeaderTopFlexSlot({ id, basisPx, className, children }: HeaderTopFlexSlotProps) {
  return (
    <div
      data-header-top-slot={id}
      className={cn("flex h-10 min-w-0 items-center overflow-hidden", className)}
      style={{ flex: `0 1 ${basisPx}px` } as CSSProperties}
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
  // topContactsWidth оставляем в пропсах для совместимости с site-shell,
  // но в новой схеме он не нужен (оба layout'а в absolute-панелях).
  topContactsWidth: _topContactsWidth,
  isBurgerMode,
  isSmUp,
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

  // Сверх-узкий режим верхней строки (ниже sm):
  // телефон+телеграм уезжают вверх, снизу въезжает phone-only (слева от ThemeToggle).
  // ВАЖНО: не привязываем к клику по бургеру — только к смене плотной mobile-вёрстки.
  const isTightTopBar = isBurgerMode && !isSmUp;

  const telegramHref = (contacts.telegramUrl?.trim() || "https://t.me/IntemaGroup").trim();
  const telegramLabel = formatTelegramHandle(telegramHref) ?? "@IntemaGroup";

  // Мобильная "пара" (телефон + телеграм) и phone-only используют те же ширины,
  // но в mobile мы позволяем shrink через flex-basis, чтобы элементы не упирались в логотип.
  const mobilePhoneBasis = HEADER_TOP_STABLE_SLOTS.phone;
  const mobileTelegramBasis = HEADER_TOP_STABLE_SLOTS.telegram;

  return (
    <div
      className={cn(
        "relative h-full w-full min-w-0 max-w-full overflow-hidden rounded-lg",
        "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
      )}
    >
      <HeaderWagon
        // desktop -> mobile (burger): primary уезжает вверх, secondary въезжает снизу
        // mobile -> desktop: secondary уезжает вниз, primary въезжает сверху
        showSecondary={isBurgerMode}
        hasHydrated={hasHydrated}
        inertProps={inertProps}
        prefersReducedMotion={prefersReducedMotion}
        durationMs={640}
        primaryEnterFrom="top"
        secondaryExitTo="bottom"
        panelBaseClassName="flex h-full w-full min-w-0 items-center justify-end"
        primaryClassName="gap-9"
        secondaryClassName="gap-3"
        primary={
          <>
            {/* Desktop: телефон + почта + CTA + theme + lang */}
            {hasTopContacts ? (
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
                    <HeaderTopPillLink
                      href={`mailto:${contacts.email}`}
                      label={contacts.email}
                      pillBase={pillBase}
                    />
                  </HeaderTopSlot>
                ) : null}
              </>
            ) : null}

            <HeaderTopSlot id="cta">
              <HeaderCta
                headerButtonBase={headerButtonBase}
                href={contactsHref}
                label={ctaLabel}
                className="w-full"
              />
            </HeaderTopSlot>

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
          </>
        }
        secondary={
          <>
            {/* Mobile (>=sm): телефон + телеграм.
                Tight mobile (<sm): телефон+телеграм уезжают вверх, phone-only въезжает снизу.
                Важно: НЕ привязано к клику по бургеру — только к смене mobile-first/плотной mobile-вёрстки. */}
            <div className="relative h-full flex-1 min-w-0">
              <HeaderWagon
                showSecondary={isTightTopBar}
                hasHydrated={hasHydrated}
                inertProps={inertProps}
                prefersReducedMotion={prefersReducedMotion}
                durationMs={640}
                // normal -> tight: primary (pair) уезжает вверх, secondary (phone-only) въезжает снизу
                // tight -> normal: secondary уезжает вниз, primary въезжает сверху
                primaryEnterFrom="top"
                secondaryExitTo="bottom"
                panelBaseClassName="flex h-full w-full min-w-0 items-center justify-end"
                primaryClassName="gap-3"
                secondaryClassName="gap-3"
                // SSR: на >=sm показываем пару, на <sm — phone-only
                ssrPrimaryClassName="hidden sm:flex"
                ssrSecondaryClassName="flex sm:hidden"
                primary={
                  <>
                    {contacts.phone ? (
                      <HeaderTopFlexSlot id="phone" basisPx={mobilePhoneBasis}>
                        <HeaderTopPillLink
                          href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}
                          label={contacts.phone}
                          pillBase={pillBase}
                        />
                      </HeaderTopFlexSlot>
                    ) : null}

                    <HeaderTopFlexSlot id="telegram" basisPx={mobileTelegramBasis}>
                      <a
                        href={telegramHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(pillBase)}
                        title={telegramLabel}
                      >
                        {telegramLabel}
                      </a>
                    </HeaderTopFlexSlot>
                  </>
                }
                secondary={
                  contacts.phone ? (
                    <HeaderTopFlexSlot id="phone" basisPx={mobilePhoneBasis}>
                      <HeaderTopPillLink
                        href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}
                        label={contacts.phone}
                        pillBase={pillBase}
                      />
                    </HeaderTopFlexSlot>
                  ) : null
                }
              />
            </div>

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
          </>
        }
      />
    </div>
  );
});
