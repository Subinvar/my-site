/**
 * ⚠️ Legacy hook.
 * Раньше использовался для синхронизации CSS-переменной `--header-height` через ResizeObserver.
 * Сейчас высота шапки держится стабильной токеном `--header-height-initial` в `src/app/globals.css`,
 * поэтому хук не используется и оставлен только как справочный.
 */

import { useLayoutEffect, useRef } from "react";

export function useHeaderHeight() {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const headerEl = headerRef.current;
    const shellEl = shellRef.current;
    if (!headerEl || !shellEl || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const h = Math.round(headerEl.getBoundingClientRect().height);
      shellEl.style.setProperty("--header-height", `${h}px`);
    };

    const observer = new ResizeObserver(update);
    observer.observe(headerEl);
    update();

    return () => observer.disconnect();
  }, []);

  return { shellRef, headerRef } as const;
}
