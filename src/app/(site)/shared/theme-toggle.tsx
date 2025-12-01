'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme | null => {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|\s*)theme=(light|dark)/);
  if (match) {
    const value = match[1] as Theme;
    document.documentElement.dataset.theme = value;
    return value;
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const initial: Theme = prefersDark ? 'dark' : 'light';
  document.documentElement.dataset.theme = initial;
  return initial;
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(getInitialTheme);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;
    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
  }, [theme]);

  const toggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Пока не знаем текущую тему — ничего не рисуем, чтобы избежать мигания
  if (!theme) return null;

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-card/80 px-3 text-xs font-medium text-foreground/80 shadow-sm backdrop-blur transition hover:bg-card"
    >
      {isDark ? 'Тёмная' : 'Светлая'}
    </button>
  );
}