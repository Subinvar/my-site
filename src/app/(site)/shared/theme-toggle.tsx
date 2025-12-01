'use client';

import { useEffect, useState } from 'react';

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