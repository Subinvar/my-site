"use client";

import type { CSSProperties } from "react";

import Link from "next/link";

import { cn } from "@/lib/cn";
import { focusRingBase } from "@/lib/focus-ring";
import type { Navigation, SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";
import { navUnderlineSpanClass } from "@/lib/nav-underline";

import { useHeaderContactLayout } from "./header-contact-layout-context";
import { pillBase } from "./ui-classes";

export type SiteFooterProps = {
  locale: Locale;
  navigation: Navigation;
  navigationLabel: string;
  currentPath: string;
  copyrightText: string;
  contacts: SiteContent["contacts"];
  tagline: string | null;
};

const FOOTER_CONTACT_SLOT_WIDTH = 140;

const footerUiFs = "calc(var(--nav-ui-fs) - 0.06rem)";

const normalizePathname = (value: string): string => {
  const [pathWithoutQuery] = value.split("?");
  const [path] = (pathWithoutQuery ?? "").split("#");
  const trimmed = (path ?? "/").replace(/\/+$/, "");
  return trimmed.length ? trimmed : "/";
};

const resolveHref = (href: string): string => {
  const normalized = (href ?? "").trim();
  return normalized.length ? normalized : "/";
};

export function SiteFooter({
  locale,
  navigation,
  navigationLabel,
  currentPath,
  copyrightText,
  contacts,
  tagline,
}: SiteFooterProps) {
  const { isBurgerMode, isBurgerContactsNarrow } = useHeaderContactLayout();

  const normalizedCurrent = normalizePathname(currentPath);

  const footerLinks = navigation.footer ?? [];

  // Два аккуратных столбика как в ТЗ.
  const linkById = new Map(footerLinks.map((link) => [link.id, link] as const));

  const columnAOrder = ["footer-binders", "footer-coatings", "footer-auxiliaries"];
  const columnBOrder = ["privacy", "footer-documents", "footer-catalog"];

  const columnA = columnAOrder
    .map((id) => linkById.get(id))
    .filter((link): link is (typeof footerLinks)[number] => Boolean(link));

  const columnB = columnBOrder
    .map((id) => linkById.get(id))
    .filter((link): link is (typeof footerLinks)[number] => Boolean(link));

  const usedIds = new Set([...columnAOrder, ...columnBOrder]);
  const rest = footerLinks.filter((link) => !usedIds.has(link.id));

  const footerColumns = [columnA, columnB.concat(rest)];

  const telegramHref = contacts.telegramUrl?.trim() ?? "";
  const telegramLabel = "@IntemaGroup";

  // Логика как в шапке:
  // - Десктоп (без бургера): показываем только Telegram
  // - Появился бургер: показываем почту
  // - Стало ещё уже (Stage 2): показываем почту + Telegram
  const showEmail = isBurgerMode;
  const showTelegram = !isBurgerMode || isBurgerContactsNarrow;

  const currentYear = new Date().getFullYear();
  const resolvedCopyright =
    copyrightText.trim().length > 0
      ? copyrightText.trim()
      : locale === "ru"
        ? `© ${currentYear} Интема Групп. Все права защищены.`
        : `© ${currentYear} Intema Group. All rights reserved.`;

  const menuLinkBaseClassName = cn(
    "group inline-flex h-10 items-center gap-1 whitespace-nowrap no-underline",
    // в подвале навигация чуть меньше, чем в шапке
    "text-[length:var(--footer-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
    "active:opacity-90",
    focusRingBase,
  );

  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto w-full max-w-screen-2xl px-[var(--header-pad-x)] py-[clamp(1.5rem,1.2rem+0.8vw,2rem)]">
        <div
          style={{ "--footer-ui-fs": footerUiFs } as CSSProperties}
          className="flex flex-col gap-5 text-muted-foreground"
        >
          {/* Tagline — первая строка, слева, размер как у меню */}
          {tagline?.trim() ? (
            <p
              className={cn(
                "m-0 text-left",
                "text-[length:var(--footer-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
                "text-foreground/90",
              )}
            >
              {tagline}
            </p>
          ) : null}

          {/* Secondary navigation */}
          {footerLinks.length ? (
            <nav aria-label={navigationLabel}>
              <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
                {footerColumns.map((column, columnIndex) => (
                  <ul
                    key={columnIndex}
                    className="m-0 flex flex-col gap-2 p-0 list-none items-start"
                  >
                    {column.map((link) => {
                      const href = resolveHref(link.href);
                      const normalizedHref = normalizePathname(href);
                      const isActive =
                        !link.isExternal &&
                        (normalizedHref === normalizedCurrent ||
                          (normalizedHref !== "/" &&
                            normalizedCurrent.startsWith(`${normalizedHref}/`)));

                      const linkClassName = cn(
                        menuLinkBaseClassName,
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      );

                      return (
                        <li key={link.id} className="m-0 p-0">
                          {link.isExternal ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={linkClassName}
                            >
                              <span className={navUnderlineSpanClass(isActive, "footer")}>
                                {link.label}
                              </span>
                            </a>
                          ) : (
                            <Link href={href} className={linkClassName}>
                              <span className={navUnderlineSpanClass(isActive, "footer")}>
                                {link.label}
                              </span>
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ))}
              </div>
            </nav>
          ) : null}

          {/* Contacts + copyright */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div
              className={cn(
                "flex flex-nowrap items-center gap-2",
                // типографика «кнопок» как в десктопных контактах шапки
                "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
              )}
            >
              {showEmail && contacts.email ? (
                <a
                  href={`mailto:${contacts.email}`}
                  className={cn("group flex-none", pillBase)}
                  style={{ width: `${FOOTER_CONTACT_SLOT_WIDTH}px` }}
                >
                  <span className={navUnderlineSpanClass(false, "footer")}>
                    {contacts.email}
                  </span>
                </a>
              ) : null}

              {showTelegram && telegramHref ? (
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn("group flex-none", pillBase)}
                  style={{ width: `${FOOTER_CONTACT_SLOT_WIDTH}px` }}
                >
                  <span className={navUnderlineSpanClass(false, "footer")}>
                    {telegramLabel}
                  </span>
                </a>
              ) : null}
            </div>

            <p className="m-0 text-[12px] leading-[1.4] sm:text-[13px]">{resolvedCopyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
