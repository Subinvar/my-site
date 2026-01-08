"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";
import { formatTelegramHandle } from "@/lib/contacts";
import { focusRingBase } from "@/lib/focus-ring";
import type { Navigation, SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";
import { navUnderlineSpanClass } from "@/lib/nav-underline";
import { normalizePathname, resolveHref } from "@/lib/url";
import { useMediaBreakpoints } from "./hooks/use-media-breakpoints";
import { HeaderWagon } from "./header-wagon";
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

export function SiteFooter({
  locale,
  navigation,
  navigationLabel,
  currentPath,
  copyrightText,
  contacts,
  tagline,
}: SiteFooterProps) {
  const { hasHydrated, isSmUp, prefersReducedMotion } = useMediaBreakpoints();
  const normalizedCurrent = normalizePathname(currentPath);

  const footerLinks = navigation.footer ?? [];

  const footerLinkColumns = (() => {
    if (!footerLinks.length) return [];

    if (footerLinks.length <= 3) return [footerLinks];

    const midpoint = Math.ceil(footerLinks.length / 2);
    return [footerLinks.slice(0, midpoint), footerLinks.slice(midpoint)];
  })();

  const telegramHref = contacts.telegramUrl?.trim() ?? "";
  const telegramLabel = formatTelegramHandle(contacts.telegramUrl) ?? "@IntemaGroup";

  const currentYear = new Date().getFullYear();
  const resolvedCopyright =
    copyrightText.trim().length > 0
      ? copyrightText.trim()
      : locale === "ru"
        ? `© ${currentYear} Интема Групп. Все права защищены.`
        : `© ${currentYear} Intema Group. All rights reserved.`;
  const menuLinkBaseClassName = cn(
    "group inline-flex h-10 items-center gap-1 whitespace-nowrap no-underline",
    "font-medium",
    "active:opacity-90",
    focusRingBase,
  );

  const contactLinkClassName = cn(
    pillBase,
    "!w-auto justify-start font-medium",
  );

  const inertProps = () => ({});

  const emailNode = contacts.email ? (
    <a
      href={`mailto:${contacts.email}`}
      className={contactLinkClassName}
    >
      {contacts.email}
    </a>
  ) : null;

  const telegramNode = telegramHref ? (
    <a
      href={telegramHref}
      target="_blank"
      rel="noopener noreferrer"
      className={contactLinkClassName}
    >
      {telegramLabel}
    </a>
  ) : null;

  const primaryContent = emailNode ?? telegramNode;

  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto w-full max-w-screen-2xl px-[var(--header-pad-x)] py-[clamp(1.5rem,1.2rem+0.8vw,2rem)]">
        <div className="flex flex-col gap-4 text-[13px] leading-[1.35] text-muted-foreground sm:text-[14px]">
          {/* Row 1: secondary navigation + tagline */}
          <div className="flex flex-col gap-3 sm:justify-between">
            {tagline?.trim() ? (
              <p className="m-0 text-[16px] font-semibold leading-[1.35] text-foreground sm:text-[17px]">
                {tagline}
              </p>
            ) : null}

            {footerLinks.length ? (
              <nav aria-label={navigationLabel}>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-[520px]:grid-cols-1">
                  {footerLinkColumns.map((column, columnIndex) => (
                    <ul
                      key={columnIndex}
                      className="m-0 flex flex-col items-start gap-1 p-0 list-none"
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
                                target={link.newTab ? "_blank" : undefined}
                                rel={link.newTab ? "noopener noreferrer" : undefined}
                                className={linkClassName}
                              >
                                <span className={navUnderlineSpanClass(isActive, "header")}>{link.label}</span>
                              </a>
                            ) : (
                              <Link
                                href={href}
                                target={link.newTab ? "_blank" : undefined}
                                rel={link.newTab ? "noopener noreferrer" : undefined}
                                className={linkClassName}
                              >
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

          </div>

          {/* Row 2: contacts + copyright */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex flex-col gap-2 text-[13px] leading-[1.35] sm:text-[14px]">
              {/* ✅ Оптическое выравнивание по тексту (а не по границе пилюли) */}
              {primaryContent ? (
                <div className="relative h-10 w-full overflow-hidden">
                  <HeaderWagon
                    showSecondary={!isSmUp}
                    hasHydrated={hasHydrated}
                    inertProps={inertProps}
                    prefersReducedMotion={prefersReducedMotion}
                    durationMs={640}
                    primaryEnterFrom="top"
                    secondaryExitTo="bottom"
                    panelBaseClassName="flex h-full w-full items-center justify-end gap-2"
                    ssrPrimaryClassName="hidden sm:flex"
                    ssrSecondaryClassName="flex sm:hidden"
                    primary={primaryContent}
                    secondary={
                      <>
                        {emailNode}
                        {telegramNode}
                      </>
                    }
                  />
                </div>
              ) : null}
            </div>

            <p className="m-0 w-full text-right text-[12px] leading-[1.4] sm:w-auto sm:self-end sm:text-[13px]">
              {resolvedCopyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
