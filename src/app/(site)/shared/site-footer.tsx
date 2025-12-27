"use client";

import Link from "next/link";
import { memo, useMemo } from "react";

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
  isBurgerMode: boolean;
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

const pickLinksByLabels = (
  links: NavigationLink[],
  desiredLabels: string[],
): NavigationLink[] => {
  const normalize = (value: string): string => value.trim().toLowerCase();

  const byLabel = new Map<string, NavigationLink>();
  for (const link of links) {
    const key = normalize(link.label ?? "");
    if (key.length) byLabel.set(key, link);
  }

  const picked: NavigationLink[] = [];
  const pickedIds = new Set<string>();

  for (const desired of desiredLabels) {
    const desiredKey = normalize(desired);

    const exact = byLabel.get(desiredKey);
    if (exact && !pickedIds.has(exact.id)) {
      picked.push(exact);
      pickedIds.add(exact.id);
      continue;
    }

    const partial = links.find((link) => {
      if (!link.label) return false;
      const key = normalize(link.label);
      return key.includes(desiredKey) || desiredKey.includes(key);
    });

    if (partial && !pickedIds.has(partial.id)) {
      picked.push(partial);
      pickedIds.add(partial.id);
    }
  }

  return picked;
};


export const SiteFooter = memo(function SiteFooter({
  locale,
  navigation,
  navigationLabel,
  currentPath,
  copyrightText,
  contacts,
  isBurgerMode,
}: SiteFooterProps) {
  const normalizedCurrent = normalizePathname(currentPath);

  const contactsHref = useMemo(() => inferContactsHref(currentPath), [currentPath]);

  const footerLinks = useMemo(() => {
    const base = navigation.footer ?? [];

    const desiredRu = [
      "Связующие",
      "Противопригарные покрытия",
      "Вспомогательные материалы",
      "Каталог",
      "Документы",
      "Политика о персональных данных",
    ];

    const desiredEn = [
      "Binders",
      "Non-stick coatings",
      "Auxiliary materials",
      "Catalog",
      "Documents",
      "Personal data policy",
    ];

    const desired = locale === "ru" ? desiredRu : desiredEn;

    const picked = pickLinksByLabels(base, desired);
    let result = picked.length ? picked : base;

    // Если по точным меткам не нашли — всё равно стараемся добавить политику
    if (!result.some((link) => isPrivacyLikeLabel(link.label))) {
      const privacy = base.find((link) => isPrivacyLikeLabel(link.label));
      if (privacy) result = [...result, privacy];
    }

    // Политика ПДн временно ведёт на страницу "Контакты"
    return result.map((link) =>
      isPrivacyLikeLabel(link.label)
        ? { ...link, href: contactsHref, isExternal: false }
        : link,
    );
  }, [navigation.footer, locale, contactsHref]);

  const footerLinkRows = useMemo(() => {
    if (footerLinks.length <= 3) return [footerLinks];
    return [footerLinks.slice(0, 3), footerLinks.slice(3)];
  }, [footerLinks]);

  const tagline =
    locale === "ru"
      ? "Заботимся о литейной промышленности — материалы для стабильных процессов и качественной отливки."
      : "Caring for foundries — materials for stable processes and quality casting.";

  const address =
    locale === "ru"
      ? "Московская обл., г. Пушкино, мкр. Мамонтовка, ул. Центральная, д. 2, лит. Б, оф. 8"
      : "Russia, Moscow Region, Pushkino, Mamontovka, Centralnaya st., 2B, office 8";

  const hours = locale === "ru" ? "Пн–Пт, 9:00–17:00" : "Mon–Fri, 9:00–17:00";

  const telegramHref = "https://t.me/IntemaGroup";

  const currentYear = new Date().getFullYear();
  const resolvedCopyright =
    copyrightText.trim().length > 0
      ? copyrightText.trim()
      : `© ${currentYear} Интема Групп. Все права защищены.`;

  const dotClassName = "text-muted-foreground/60";

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
    "text-[length:var(--header-ui-fs)] font-medium leading-[var(--header-ui-leading)]",
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
    <footer className="border-t border-border bg-muted/60">
      <div className="mx-auto w-full max-w-screen-2xl px-[var(--header-pad-x)] py-6">
        <div className="flex flex-col gap-4 text-xs text-muted-foreground">
          {/* Row 1: tagline + secondary navigation */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-xs font-medium text-foreground/90">{tagline}</p>

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
                                rel="noreferrer"
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
            <div className="flex flex-col gap-1 text-[11px] sm:text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(baseLinkClassName, "hover:text-foreground")}
                >
                  Telegram
                </a>

                {isBurgerMode ? (
                  <>
                    {contacts.phone ? (
                      <>
                        <span className={dotClassName}>•</span>
                        <a
                          href={`tel:${contacts.phone.replace(/[^+\d]/g, "")}`}
                          className={cn(baseLinkClassName, "hover:text-foreground")}
                        >
                          {contacts.phone}
                        </a>
                      </>
                    ) : null}

                    {contacts.email ? (
                      <>
                        <span className={dotClassName}>•</span>
                        <a
                          href={`mailto:${contacts.email}`}
                          className={cn(baseLinkClassName, "hover:text-foreground")}
                        >
                          {contacts.email}
                        </a>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span className={dotClassName}>•</span>
                    <span>{address}</span>
                    <span className={dotClassName}>•</span>
                    <span>{hours}</span>
                  </>
                )}
              </div>

              {isBurgerMode ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>{address}</span>
                  <span className={dotClassName}>•</span>
                  <span>{hours}</span>
                </div>
              ) : null}
            </div>

            <p className="m-0 text-[11px] sm:text-xs">{resolvedCopyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
});
