'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { buttonClassNames } from '@/app/(site)/shared/ui/button-classes';
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

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (!isClient) return;

    setTheme(resolveInitialClientTheme());
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    applyTheme(theme);
  }, [theme, isMounted]);

  const toggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  // Капсула — та же геометрия и стиль, что у переключателя языка
  const baseClasses =
    'relative overflow-hidden rounded-full border border-border shadow-sm no-underline w-11 bg-background/70';

  return (
    <button
      type="button"
      onClick={toggle}
      ref={buttonRef}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className={buttonClassNames({
        variant: 'ghost',
        size: 'sm',
        className: cn(
          baseClasses,
          'inline-flex items-center justify-center px-0 py-0',
          'transition-transform duration-150',
          'hover:-translate-y-[1px] active:translate-y-[1px]',
          'hover:bg-background/80 focus-visible:bg-background/80',
        ),
      })}
      disabled={!isMounted}
    >
      <span className="relative inline-flex items-center justify-center">
        {!isMounted ? (
          <span
            className="h-4 w-4 animate-pulse rounded-full bg-muted"
            aria-hidden
          />
        ) : (
          <>
            <SunIcon
              className={`h-4 w-4 transition-transform duration-200 ${
                isDark ? 'scale-0 rotate-90' : 'scale-100 rotate-0'
              }`}
            />
            <MoonIcon
              className={`absolute h-4 w-4 transition-transform duration-200 ${
                isDark ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
              }`}
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
