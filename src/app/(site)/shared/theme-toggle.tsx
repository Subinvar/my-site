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

const resolveInitialClientTheme = (): Theme => {
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
  const [theme, setTheme] = useState<Theme | null>(() => {
    if (typeof document === 'undefined') {
      return null;
    }

    return resolveInitialClientTheme();
  });

  useEffect(() => {
    if (theme) {
      applyTheme(theme);
    }
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
      disabled={!theme}
    >
      <span className="sr-only">
        {!theme ? 'Загрузка темы' : isDark ? 'Светлая тема' : 'Тёмная тема'}
      </span>
      <span className="relative inline-flex items-center justify-center">
        {!theme ? (
          <span className="h-4 w-4 animate-pulse rounded-full bg-muted" aria-hidden />
        ) : (
          <>
            <SunIcon
              className={`h-4 w-4 transition-transform duration-200 ${isDark ? 'scale-0 rotate-90' : 'scale-100 rotate-0'}`}
            />
            <MoonIcon
              className={`absolute h-4 w-4 transition-transform duration-200 ${isDark ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'}`}
            />
          </>
        )}
      </span>
    </Button>
  );
}
