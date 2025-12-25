"use client";

import { memo } from "react";

import { NavigationList } from "@/app/[locale]/navigation-list";
import type { Navigation } from "@/lib/keystatic";

export type SiteFooterProps = {
  navigation: Navigation;
  navigationLabel: string;
  currentPath: string;
  copyrightText: string;
};

export const SiteFooter = memo(function SiteFooter({
  navigation,
  navigationLabel,
  currentPath,
  copyrightText,
}: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-muted/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <NavigationList
            links={navigation.footer}
            ariaLabel={navigationLabel}
            currentPath={currentPath}
          />
        </div>

        {copyrightText.length ? (
          <p className="text-[11px] sm:text-xs">{copyrightText}</p>
        ) : null}
      </div>
    </footer>
  );
});

