import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function useScrollElevation() {
  // Начальное значение совпадает на сервере и клиенте, чтобы избежать проблем гидратации
  const [isHeaderElevated, setIsHeaderElevated] = useState(false);
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);
  const scheduleStateUpdate = (update: () => void) => queueMicrotask(update);

  useLayoutEffect(() => {
    // 1) берём то, что уже выставил ранний скрипт в layout.tsx
    const preset = document.documentElement.dataset.headerElevated;
    if (preset === "1") {
      scheduleStateUpdate(() => setIsHeaderElevated(true));
    }

    // 2) и уточняем после того, как браузер восстановит scroll (часто это происходит чуть позже)
    let raf1 = 0;
    let raf2 = 0;

    const compute = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const next = y > 0;
      setIsHeaderElevated((prev) => (prev === next ? prev : next));
    };

    raf1 = requestAnimationFrame(() => {
      compute();
      raf2 = requestAnimationFrame(compute);
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel) return;

    if (typeof IntersectionObserver === "undefined") {
      // Fallback для очень старых браузеров
      const onScroll = () => {
        const next = window.scrollY > 1;
        setIsHeaderElevated((prev) => (prev === next ? prev : next));
      };
      requestAnimationFrame(onScroll);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = !entry.isIntersecting;
        setIsHeaderElevated((prev) => (prev === next ? prev : next));
      },
      { root: null, threshold: 0 },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.headerElevated = isHeaderElevated ? "1" : "0";
  }, [isHeaderElevated]);

  return { isHeaderElevated, scrollSentinelRef } as const;
}
