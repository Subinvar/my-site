import type { ReactNode } from "react";

import { getInterfaceDictionary } from "@/content/dictionary";
import type { Navigation, SiteContent } from "@/lib/keystatic";
import type { Locale } from "@/lib/i18n";

import { SiteFooter } from "./site-footer";
import { SiteShell } from "./site-shell";

export type SiteShellLayoutProps = {
  locale: Locale;
  targetLocale: Locale;
  site: SiteContent;
  navigation: Navigation;
  switcherHref: string | null;
  currentPath: string;
  currentYear: number;
  children: ReactNode;
};

export function SiteShellLayout({
  locale,
  targetLocale,
  site,
  navigation,
  switcherHref,
  currentPath,
  currentYear,
  children,
}: SiteShellLayoutProps) {
  const dictionary = getInterfaceDictionary(locale);
  const navigationLabels = dictionary.navigation;

  const brandName = site.name?.trim() ?? "";
  const copyrightTemplate = site.footer?.copyright?.trim() ?? "";

  const copyrightText = copyrightTemplate.length
    ? copyrightTemplate.replaceAll("{year}", String(currentYear)).replaceAll("{siteName}", brandName)
    : "";

  return (
    <SiteShell
      locale={locale}
      targetLocale={targetLocale}
      site={site}
      navigation={navigation}
      switcherHref={switcherHref}
      currentPath={currentPath}
      footer={
        <SiteFooter
          locale={locale}
          navigation={navigation}
          navigationLabel={navigationLabels.footerLabel}
          currentPath={currentPath}
          copyrightText={copyrightText}
          contacts={site.contacts}
          tagline={site.footer.tagline}
        />
      }
    >
      {children}
    </SiteShell>
  );
}
