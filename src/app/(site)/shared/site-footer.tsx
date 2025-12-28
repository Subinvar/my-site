import Link from "next/link";

import { cn } from "@/lib/cn";
import type { Navigation, NavigationLink, SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";

export type SiteFooterProps = {
  locale: Locale;
  navigation: Navigation;
  navigationLabel: string;
  currentPath: string;
  copyrightText: string;
  contacts: SiteContent["contacts"];
  tagline: string | null;
  address: string | null;
  hours: string | null;
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

const inferContactsHref = (currentPath: string): string => {
  const normalized = normalizePathname(currentPath);
  const isEn = normalized === "/en" || normalized.startsWith("/en/");
  return isEn ? "/en/contacts" : "/contacts";
};

const isPrivacyLikeLabel = (label: string): boolean => {
  const v = (label ?? "").trim().toLowerCase();
  return (
    v.includes("персон") ||
    v.includes("privacy") ||
    v.includes("personal data") ||
    v.includes("персональн")
  );
};

export function SiteFooter({
  locale,
  navigation,
  navigationLabel,
  currentPath,
  copyrightText,
  contacts,
  tagline,
  address,
  hours,
}: SiteFooterProps) {
  const normalizedCurrent = normalizePathname(currentPath);

  const contactsHref = inferContactsHref(currentPath);

  const footerLinks = (() => {
    const base = navigation.footer ?? [];

    if (!base.length) return base;

    // Политика ПДн временно ведёт на страницу "Контакты"
    return base.map((link) => {
      const isPrivacyLink = link.id === "privacy" || isPrivacyLikeLabel(link.label);
      return isPrivacyLink
        ? { ...link, href: contactsHref, isExternal: false }
        : link;
    });
  })();

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
    "after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:rounded-full",
    "after:origin-left after:transition-[transform,background-color] after:duration-200 after:ease-out",
    "after:bg-transparent after:scale-x-0",
    "hover:after:bg-[color:var(--header-border)] hover:after:scale-x-100",
    "focus-visible:after:bg-[color:var(--header-border)] focus-visible:after:scale-x-100",
    "active:opacity-90",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  );


  const menuLinkBaseClassName = cn(
    "group inline-flex h-10 items-center gap-1 no-underline",
    "text-[clamp(0.875rem,0.84rem+0.18vw,0.95rem)] font-medium leading-[1.15]",
    "active:opacity-90",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  );

  const menuLabelBaseClassName =
    "relative inline-flex h-full items-center after:absolute after:left-0 after:right-0 after:bottom-0 after:rounded-full after:origin-left after:transition-[transform,background-color] after:duration-200 after:ease-out";

  const menuLabelClassName = cn(
    menuLabelBaseClassName,
    "after:h-[1px] after:bg-transparent after:scale-x-0",
    "group-hover:after:bg-[color:var(--header-border)] group-focus-visible:after:bg-[color:var(--header-border)]",
    "group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100",
  );

  const menuActiveLabelClassName = cn(
    menuLabelBaseClassName,
    "after:h-[2px] after:scale-x-100 after:bg-current",
    "group-hover:after:bg-current group-focus-visible:after:bg-current",
  );


  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto w-full max-w-screen-2xl px-[var(--header-pad-x)] py-[clamp(1.5rem,1.2rem+0.8vw,2rem)]">
        <div className="flex flex-col gap-4 text-[13px] leading-[1.35] text-muted-foreground sm:text-[14px]">
          {/* Row 1: tagline + secondary navigation */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {tagline?.trim() ? (
              <p className="m-0 text-[14px] font-medium leading-[1.35] text-foreground/90 sm:text-[15px]">
                {tagline}
              </p>
            ) : null}

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

                        const labelClassName = isActive
                          ? menuActiveLabelClassName
                          : menuLabelClassName;

                        return (
                          <li key={link.id} className="m-0 p-0">
                            {link.isExternal ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={linkClassName}
                              >
                                <span className={labelClassName}>{link.label}</span>
                              </a>
                            ) : (
                              <Link href={href} className={linkClassName}>
                                <span className={labelClassName}>{link.label}</span>
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

                {address?.trim() ? <span className="hidden lg:inline">{address}</span> : null}
                {hours?.trim() ? <span className="hidden lg:inline whitespace-nowrap">{hours}</span> : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 lg:hidden">
                {address?.trim() ? <span>{address}</span> : null}
                {hours?.trim() ? <span className="whitespace-nowrap">{hours}</span> : null}
              </div>
            </div>

            <p className="m-0 text-[12px] leading-[1.4] sm:text-[13px]">{resolvedCopyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}