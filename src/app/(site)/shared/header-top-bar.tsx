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
  className?: string;
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

function HeaderTopPillLink({ href, label, pillBase, className }: HeaderTopPillLinkProps) {
  return (
    <a href={href} className={cn(pillBase, className)} title={label}>
      {label}
    </a>
  );
}

const DESKTOP_TOP_GAP_PX = 36; // соответствует tailwind gap-9 (2.25rem)
const DESKTOP_TOP_TARGET_INSET_SUM_PX = 24;

const DESKTOP_TOP_EDGE_INSETS: Record<
  string,
  {
    left: number;
    right: number;
  }
> = {
  phone: { left: 12, right: 12 },
  email: { left: 12, right: 12 },
  cta: { left: 0, right: 0 },
  theme: { left: 12, right: 12 },
  lang: { left: 12, right: 12 },
};

type HeaderTopElasticSpacerProps = {
  extraPx: number;
};

function HeaderTopElasticSpacer({ extraPx }: HeaderTopElasticSpacerProps) {
  const basisClass = extraPx >= 24 ? "basis-6" : extraPx >= 12 ? "basis-3" : "basis-0";

  return <div aria-hidden="true" className={cn("grow shrink", basisClass)} />;
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
      {/*
        ⚠️ Важный фикс: на некоторых масштабах браузера (например, 90%) многослойная
        конструкция из нескольких absolute-слоёв может «разъезжаться» из‑за дробного
        пиксельного округления. Оставляем один центрирующий элемент — так ореол и центр
        всегда соосны.
      */}
      <span aria-hidden="true" className="relative mr-2.5 inline-flex h-3.5 w-3.5 items-center justify-center">
        <span
          className={cn(
            "relative h-2.5 w-2.5 rounded-full",
            "bg-[radial-gradient(circle_at_center,var(--color-brand-600)_0%,var(--color-brand-600)_54%,#a8242c_74%,#d88993_86%,#f7d5dc_100%)]",
            "shadow-[0_0_0_1px_rgba(148,27,32,0.35),0_0_0_3px_rgba(148,27,32,0.12),0_0_10px_rgba(148,27,32,0.16)]",
            "transition-transform duration-200 ease-out",
            "group-hover:scale-110 group-focus-visible:scale-110",
            "motion-reduce:transition-none motion-reduce:duration-0",
            "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.08)_72%,transparent_100%)] after:content-['']",
          )}
        />
      </span>
      {children ?? label}
    </Link>
  );
});

export const HeaderTopBar = memo(function HeaderTopBar({
  contacts,
  hasTopContacts,
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

  // Desktop: сохраняем прежнюю общую длину строки (как было с fixed-slots + gap-9),
  // но выравниваем расстояния МЕЖДУ видимыми элементами.
  const showDesktopPhone = hasTopContacts && Boolean(contacts.phone?.trim());
  const showDesktopEmail = hasTopContacts && Boolean(contacts.email?.trim());

  const desktopSlotIds = [
    ...(showDesktopPhone ? ["phone"] : []),
    ...(showDesktopEmail ? ["email"] : []),
    "cta",
    "theme",
    "lang",
  ];

  const desktopRowWidthPx =
    desktopSlotIds.reduce((sum, id) => sum + (HEADER_TOP_STABLE_SLOTS[id] ?? 0), 0) +
    Math.max(0, desktopSlotIds.length - 1) * DESKTOP_TOP_GAP_PX;

  const desktopItems: Array<{ id: string; node: ReactNode }> = [];

  if (showDesktopPhone && contacts.phone) {
    desktopItems.push({
      id: "phone",
      node: (
        <HeaderTopPillLink
          href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}
          label={contacts.phone}
          pillBase={pillBase}
          className="w-fit"
        />
      ),
    });
  }

  if (showDesktopEmail && contacts.email) {
    desktopItems.push({
      id: "email",
      node: (
        <HeaderTopPillLink
          href={`mailto:${contacts.email}`}
          label={contacts.email}
          pillBase={pillBase}
          className="w-fit"
        />
      ),
    });
  }

  desktopItems.push(
    {
      id: "cta",
      node: (
        <HeaderTopSlot id="cta">
          <HeaderCta
            headerButtonBase={headerButtonBase}
            href={contactsHref}
            label={ctaLabel}
            className="w-full"
          />
        </HeaderTopSlot>
      ),
    },
    { id: "theme", node: <ThemeToggle locale={locale} /> },
    {
      id: "lang",
      node: (
        <LanguageSwitcher
          currentLocale={locale}
          targetLocale={targetLocale}
          href={switcherHref}
          switchToLabels={switchToLabels}
        />
      ),
    },
  );

  const desktopRow: ReactNode[] = [];
  for (let i = 0; i < desktopItems.length; i += 1) {
    const current = desktopItems[i];
    const next = desktopItems[i + 1];

    desktopRow.push(
      <div key={`item-${current.id}`} className="flex-none min-w-0">
        {current.node}
      </div>,
    );

    if (next) {
      const currentInsets = DESKTOP_TOP_EDGE_INSETS[current.id] ?? { left: 0, right: 0 };
      const nextInsets = DESKTOP_TOP_EDGE_INSETS[next.id] ?? { left: 0, right: 0 };
      const insetSum = currentInsets.right + nextInsets.left;
      const extraPx = Math.max(0, DESKTOP_TOP_TARGET_INSET_SUM_PX - insetSum);

      desktopRow.push(
        <HeaderTopElasticSpacer key={`spacer-${current.id}-${next.id}`} extraPx={extraPx} />,
      );
    }
  }

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
        secondaryClassName="gap-3"
        primary={
          <div
            className="flex h-full min-w-0 items-center"
            style={{ width: `${desktopRowWidthPx}px` } as CSSProperties}
          >
            {desktopRow}
          </div>
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
