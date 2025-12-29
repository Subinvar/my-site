"use client";

import { createContext, useContext, type ReactNode } from "react";

export type HeaderContactLayoutState = {
  /** Burger-режим активен: либо <lg, либо nav не влез. */
  isBurgerMode: boolean;

  /**
   * Второй порог: слишком узко, чтобы держать телефон + Telegram рядом с кнопками снизу.
   * Тогда телефон переносим в верхний ряд (к ThemeToggle), а Telegram уходит в бургер.
   */
  isBurgerContactsNarrow: boolean;
};

const HeaderContactLayoutContext = createContext<HeaderContactLayoutState | null>(null);

export function HeaderContactLayoutProvider({
  value,
  children,
}: {
  value: HeaderContactLayoutState;
  children: ReactNode;
}) {
  return (
    <HeaderContactLayoutContext.Provider value={value}>
      {children}
    </HeaderContactLayoutContext.Provider>
  );
}

export function useHeaderContactLayout(): HeaderContactLayoutState {
  // Вне провайдера ведём себя как «десктоп без бургера» — безопасный дефолт.
  return (
    useContext(HeaderContactLayoutContext) ??
    ({ isBurgerMode: false, isBurgerContactsNarrow: false } as const)
  );
}
