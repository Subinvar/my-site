import { useEffect, useRef, useState } from "react";

export function useScrollElevation() {
  const [isHeaderElevated, setIsHeaderElevated] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 1 : false,
  );
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel) return;

    if (typeof IntersectionObserver === "undefined") {
      // Fallback для очень старых браузеров
      const onScroll = () => {
        const next = window.scrollY > 1;
        setIsHeaderElevated((prev) => (prev === next ? prev : next));
      };
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

  return { isHeaderElevated, scrollSentinelRef } as const;
}
