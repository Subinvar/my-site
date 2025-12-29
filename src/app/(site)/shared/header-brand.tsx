"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";

import { cn } from "@/lib/cn";

export type HeaderBrandProps = {
  href: string;
  label: string;
};

export const HeaderBrand = memo(function HeaderBrand({ href, label }: HeaderBrandProps) {
  return (
    <div className="flex items-center lg:h-full lg:w-full lg:items-center lg:justify-start lg:rounded-lg">
      <Link
        href={href}
        className="flex items-center gap-2 text-left no-underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Image
          src="/uploads/logo.svg"
          alt={label}
          width={116}
          height={116}
          priority
          sizes="(min-width: 1024px) 116px, (min-width: 640px) 96px, 78px"
          className="h-[var(--header-logo-h)] w-auto object-contain"
        />
        <span
            aria-hidden="true"
            className={cn(
              "font-[var(--font-heading)]",
              "text-[length:var(--header-brand-fs)] font-bold leading-[1.1]",
              "tracking-[-0.02em] text-[var(--color-brand-600)] dark:text-[var(--color-brand-600)]",
            )}
          >
          {label}
        </span>
      </Link>
    </div>
  );
});

