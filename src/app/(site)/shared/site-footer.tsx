"use client";

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

  const footerLinkRows = (() => {
    if (footerLinks.length <= 3) return [footerLinks];
    return [footerLinks.slice(0, 3), footerLinks.slice(3)];
  })();

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
        <div className="flex flex-col gap-5 text-muted-foreground">
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
              <div className="flex flex-col gap-2 sm:items-end">
                {footerLinkRows.map((row, rowIndex) => (
                  <ul
                    key={rowIndex}
                    className="m-0 flex flex-wrap items-center gap-x-6 gap-y-2 p-0 list-none justify-start sm:justify-end"
                  >
                    {row.map((link) => {
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
                "flex flex-wrap items-center gap-2",
                // типографика «кнопок» как в десктопных контактах шапки
                "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
              )}
            >
              {showEmail && contacts.email ? (
                <a
                  href={`mailto:${contacts.email}`}
                  className={cn("group", pillBase, "w-auto")}
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
                  className={cn("group", pillBase, "w-auto")}
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