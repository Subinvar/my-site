import { useLayoutEffect, useRef, useState } from "react";

export function useMediaBreakpoints() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLgUp, setIsLgUp] = useState(false);
  const [hasHydrated] = useState(() => typeof window !== "undefined");
  const [isCompactNav, setIsCompactNav] = useState(false);

  const navHostRef = useRef<HTMLDivElement | null>(null);
  const navMeasureRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lg = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      setPrefersReducedMotion(rm.matches);
      setIsLgUp(lg.matches);
    };

    update();

    rm.addEventListener("change", update);
    lg.addEventListener("change", update);

    return () => {
      rm.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isLgUp) {
      const frame = window.requestAnimationFrame(() => setIsCompactNav(false));
      return () => window.cancelAnimationFrame(frame);
    }

    const host = navHostRef.current;
    const measure = navMeasureRef.current;
    if (!host || !measure || typeof ResizeObserver === "undefined") return;

    const HYST = 32;
    const PAD = 16;
    let raf = 0;

    const recalc = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const hostW = Math.round(host.getBoundingClientRect().width);
        const navW = Math.round(measure.getBoundingClientRect().width);
        if (!hostW || !navW) return;

        setIsCompactNav((prev) => {
          if (!prev) return navW > hostW - PAD;
          return navW > hostW - (HYST + PAD);
        });
      });
    };

    const ro = new ResizeObserver(recalc);
    ro.observe(host);
    ro.observe(measure);
    recalc();

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [isLgUp]);

  return {
    prefersReducedMotion,
    isLgUp,
    hasHydrated,
    isCompactNav,
    isBurgerMode: !isLgUp || isCompactNav,
    navHostRef,
    navMeasureRef,
  } as const;
}
