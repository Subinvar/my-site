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

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
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
  const [isMounted, setIsMounted] = useState(isClient);
  const [theme, setTheme] = useState<Theme>(() => resolveInitialClientTheme());
  const [isFilled, setIsFilled] = useState(false);
  const [transitionsReady, setTransitionsReady] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (!isClient) return;

    setIsMounted(true);
    setTheme(resolveInitialClientTheme());

    const node = buttonRef.current;
    if (!node) return;

    try {
      const hoveredOnMount = node.matches(':hover');
      setIsFilled(hoveredOnMount);
    } catch {
      // просто продолжаем без предзаполнения
    }

    setTransitionsReady(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    applyTheme(theme);
  }, [theme, isMounted]);

  const toggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';
  const baseClasses =
    'relative flex items-center justify-center overflow-hidden rounded-full border border-border shadow-sm w-12 bg-transparent group';

  return (
    <button
      type="button"
      onClick={toggle}
      ref={buttonRef}
      onMouseEnter={() => setIsFilled(true)}
      onMouseLeave={() => setIsFilled(false)}
      onFocus={() => setIsFilled(true)}
      onBlur={() => setIsFilled(false)}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className={buttonClassNames({
        variant: 'ghost',
        size: 'sm',
        className: cn(baseClasses, 'hover:bg-transparent focus-visible:bg-transparent'),
      })}
      disabled={!isMounted}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-brand-50',
          transitionsReady && 'transition-transform duration-300 ease-out',
          'group-hover:translate-y-0 group-focus-visible:translate-y-0',
          isFilled ? 'translate-y-0' : 'translate-y-full',
        )}
      />

      <span className="relative z-10 inline-flex items-center justify-center">
        {!isMounted ? (
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

      <span className="sr-only">
        {!isMounted ? 'Загрузка темы' : isDark ? 'Светлая тема' : 'Тёмная тема'}
      </span>
    </button>
  );
}
