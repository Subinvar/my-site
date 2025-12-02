'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/app/(site)/shared/ui/button';

type Theme = 'light' | 'dark';

const resolveStoredTheme = (): Theme | null => {
  const match = document.cookie.match(/(?:^|\s*)theme=(light|dark)/);

  if (match) {
    return match[1] as Theme;
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return null;
};

const resolveInitialTheme = (): Theme => {
  if (typeof document === 'undefined') {
    return 'light';
  }

  const attrTheme = document.documentElement.dataset.theme;
  if (attrTheme === 'dark' || attrTheme === 'light') {
    return attrTheme;
  }

  const stored = resolveStoredTheme();
  if (stored) {
    return stored;
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

const applyTheme = (value: Theme) => {
  document.documentElement.dataset.theme = value;
  document.cookie = `theme=${value}; path=/; max-age=31536000`;
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  useEffect(() => {
    const stored = resolveStoredTheme();

    if (stored && stored !== theme) {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- синхронизируем с кукой, чтобы не мигал не тот значок
      setTheme(stored);
      applyTheme(stored);
      return;
    }

    applyTheme(theme);
  }, [theme]);

  const toggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      variant="ghost"
      size="sm"
      className="rounded-full border border-border shadow-sm hover:bg-muted"
    >
      <span className="sr-only">{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>
      <span className="relative inline-flex items-center justify-center">
        <SunIcon
          className={`h-4 w-4 transition-transform duration-200 ${isDark ? 'scale-0 rotate-90' : 'scale-100 rotate-0'}`}
        />
        <MoonIcon
          className={`absolute h-4 w-4 transition-transform duration-200 ${isDark ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}`}
        />
      </span>
    </Button>
  );
}
