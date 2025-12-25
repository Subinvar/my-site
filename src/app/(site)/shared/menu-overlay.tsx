"use client";

import { memo } from "react";

import { cn } from "@/lib/cn";

type MenuOverlayProps = {
  isVisible: boolean;
  onClose: () => void;
};

export const MenuOverlay = memo(function MenuOverlay({
  isVisible,
  onClose,
}: MenuOverlayProps) {
  if (!isVisible) return null;

  return (
    <button
      type="button"
      className={cn(
        "fixed inset-0 z-30 bg-black/60 backdrop-blur-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
      )}
      onClick={onClose}
    />
  );
});

