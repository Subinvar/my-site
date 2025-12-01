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

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = resolveStoredTheme();

    if (initial) {
      // Синхронизируем состояние с темой из куков сразу после монтирования
      // eslint-disable-next-line react-hooks/set-state-in-effect -- подхватываем сохранённую тему, чтобы не терять выбор пользователя
      setTheme(initial);
      document.documentElement.dataset.theme = initial;
      document.cookie = `theme=${initial}; path=/; max-age=31536000`;
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
  }, [mounted, theme]);

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
