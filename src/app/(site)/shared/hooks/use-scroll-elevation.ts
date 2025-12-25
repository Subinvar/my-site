import { useRef, useState } from "react";

import { useIntersection } from "./use-intersection";
import { useScrollPosition } from "./use-scroll-position";

export function useScrollElevation() {
  const [isHeaderElevated, setIsHeaderElevated] = useState(false);
  const scrollSentinelRef = useRef<HTMLDivElement | null>(null);

  useIntersection(
    scrollSentinelRef,
    (entry) => {
      const next = !entry.isIntersecting;
      setIsHeaderElevated((prev) => (prev === next ? prev : next));
    },
    { threshold: 0, rootMargin: "-1px 0px 0px 0px" },
  );

  useScrollPosition(
    () => {
      const next = typeof window !== "undefined" ? window.scrollY > 1 : false;
      setIsHeaderElevated((prev) => (prev === next ? prev : next));
    },
    { immediate: true },
  );

  return { isHeaderElevated, scrollSentinelRef } as const;
}
