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
