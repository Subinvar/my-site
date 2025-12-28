import Link from "next/link";

import { cn } from "@/lib/cn";
import type { Navigation, SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";
import { navUnderlineSpanClass } from "@/lib/nav-underline";

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
  const normalizedCurrent = normalizePathname(currentPath);

  const footerLinks = navigation.footer ?? [];

  const footerLinkRows = (() => {
    if (footerLinks.length <= 3) return [footerLinks];
    return [footerLinks.slice(0, 3), footerLinks.slice(3)];
  })();

  const telegramHref = contacts.telegramUrl?.trim() ?? "";

  const currentYear = new Date().getFullYear();
  const resolvedCopyright =
    copyrightText.trim().length > 0
      ? copyrightText.trim()
      : locale === "ru"
        ? `© ${currentYear} Интема Групп. Все права защищены.`
        : `© ${currentYear} Intema Group. All rights reserved.`;
  const baseLinkClassName = cn(
    "relative inline-flex items-center no-underline",
    // та же геометрия, что и в nav-underline
    "after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:rounded-full",
    "after:h-[var(--nav-underline-h,1px)]",
    // underline = currentColor, но по умолчанию скрыт
    "after:bg-current after:opacity-0 after:origin-left after:scale-x-0",
    // анимация
    "after:transition-[transform,opacity] after:duration-200 after:ease-out",
    // hover/focus → показываем деликатно (тот же токен, что ты уже завёл)
    "hover:after:opacity-[var(--nav-underline-hover-opacity,0.5)] hover:after:scale-x-100",
    "focus-visible:after:opacity-[var(--nav-underline-hover-opacity,0.5)] focus-visible:after:scale-x-100",
    "active:opacity-90",
    // твой стандартный focus-ring
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  );

  const menuLinkBaseClassName = cn(
    "group inline-flex h-10 items-center gap-1 whitespace-nowrap no-underline",
    "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
    "active:opacity-90",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  );

  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto w-full max-w-screen-2xl px-[var(--header-pad-x)] py-[clamp(1.5rem,1.2rem+0.8vw,2rem)]">
        <div className="flex flex-col gap-4 text-[13px] leading-[1.35] text-muted-foreground sm:text-[14px]">
          {/* Row 1: secondary navigation + tagline */}
          <div className="flex flex-col gap-3 sm:items-end sm:justify-between">
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
                                <span className={navUnderlineSpanClass(isActive, "header")}>{link.label}</span>
                              </a>
                            ) : (
                              <Link href={href} className={linkClassName}>
                                <span className={navUnderlineSpanClass(isActive, "header")}>{link.label}</span>
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

            {tagline?.trim() ? (
              <p className="m-0 text-[14px] font-medium leading-[1.35] text-foreground/90 sm:text-right sm:text-[15px]">
                {tagline}
              </p>
            ) : null}
          </div>

          {/* Row 2: contacts + copyright */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2 text-[13px] leading-[1.35] sm:text-[14px]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {telegramHref ? (
                  <a
                    href={telegramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(baseLinkClassName, "hover:text-foreground")}
                  >
                    Telegram
                  </a>
                ) : null}

                {contacts.phone ? (
                  <a
                    href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}
                    className={cn(baseLinkClassName, "hover:text-foreground", "lg:hidden")}
                  >
                    {contacts.phone}
                  </a>
                ) : null}

                {contacts.email ? (
                  <a
                    href={`mailto:${contacts.email}`}
                    className={cn(baseLinkClassName, "hover:text-foreground", "lg:hidden")}
                  >
                    {contacts.email}
                  </a>
                ) : null}
              </div>
            </div>

            <p className="m-0 text-[12px] leading-[1.4] sm:text-[13px]">{resolvedCopyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}