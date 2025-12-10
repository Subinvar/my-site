'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useState } from 'react';

import { cn } from '@/lib/cn';

type Theme = 'light' | 'dark';

const isClient = typeof document !== 'undefined';

const resolveStoredTheme = (): Theme | null => {
  if (!isClient) return null;

  const match = document.cookie.match(/(?:^|\s*)theme=(light|dark)/);
  if (match) {
    return match[1] as Theme;
  }

  return null;
};

const resolveInitialClientTheme = (): Theme => {
  if (!isClient) return 'light';

  const attrTheme = document.documentElement.dataset.theme;
  if (attrTheme === 'dark' || attrTheme === 'light') {
    return attrTheme;
  }

  const stored = resolveStoredTheme();
  if (stored) return stored;

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

const applyTheme = (theme: Theme) => {
  if (!isClient) return;

  const root = document.documentElement;
  root.dataset.theme = theme;

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `theme=${theme}; path=/; expires=${expires.toUTCString()}`;
};

export function ThemeToggle() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  useLayoutEffect(() => {
    if (!isClient) return;

    const frameId = window.requestAnimationFrame(() => {
      setTheme(resolveInitialClientTheme());
      setIsMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    applyTheme(theme);
  }, [theme, isMounted]);

  const toggle = () => {
    if (!isMounted) return;
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  // Капсула — по геометрии и поведению как у бургера / языка:
  // - квадрат 40×40
  // - rounded-xl
  // - бордер только на hover
  // - никаких translate/scale → кнопка не "прыгает"
  const containerClasses = cn(
    'inline-flex h-10 w-10 items-center justify-center rounded-xl',
    'border border-transparent bg-background/70 text-muted-foreground transition-colors duration-150',
    'hover:border-[var(--border)] hover:bg-background/80 hover:text-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-[var(--color-brand-600)] focus-visible:ring-offset-[var(--background)]',
    !isMounted && 'cursor-default opacity-60 hover:border-transparent hover:bg-background/70',
  );

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className={containerClasses}
      disabled={!isMounted}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        {!isMounted ? (
          <span
            className="h-4 w-4 animate-pulse rounded-full bg-muted"
            aria-hidden
          />
        ) : (
          <>
            <SunIcon
              className={cn(
                'absolute inset-0 h-4 w-4 transition-transform duration-200 ease-out',
                isDark ? 'scale-0 rotate-90' : 'scale-100 rotate-0',
              )}
            />
            <MoonIcon
              className={cn(
                'absolute inset-0 h-4 w-4 transition-transform duration-200 ease-out',
                isDark ? 'scale-100 rotate-0' : 'scale-0 -rotate-90',
              )}
            />
          </>
        )}
      </span>

      <span className="sr-only">
        {!isMounted ? 'Загрузка темы' : isDark ? 'Светлая тема' : 'Тёмная тема'}
      </span>
    </button>
  );
}
