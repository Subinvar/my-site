'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Инициализация: читаем куку или системную тему
  useEffect(() => {
    const root = document.documentElement;

    const match = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
    if (match) {
      const value = match[1] as Theme;
      root.dataset.theme = value;
      setTheme(value);
      return;
    }

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initial: Theme = prefersDark ? 'dark' : 'light';
    root.dataset.theme = initial;
    setTheme(initial);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      document.cookie = `theme=${next}; path=/; max-age=31536000`;
      return next;
    });
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