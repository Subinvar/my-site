import { useEffect, useRef, useState } from "react";

const BURGER_TRANSFORM = {
  top: (converged: boolean, rotated: boolean) =>
    `translate(-50%, -50%) translateY(${converged ? 0 : -4}px) rotate(${rotated ? 45 : 0}deg)`,
  bottom: (converged: boolean, rotated: boolean) =>
    `translate(-50%, -50%) translateY(${converged ? 0 : 4}px) rotate(${rotated ? -45 : 0}deg)`,
};

type BurgerAnimationOptions = {
  isMenuOpen: boolean;
  isBurgerMode: boolean;
  prefersReducedMotion: boolean;
  onRequestClose: () => void;
};

export function useBurgerAnimation({
  isMenuOpen,
  isBurgerMode,
  prefersReducedMotion,
  onRequestClose,
}: BurgerAnimationOptions) {
  const [areLinesConverged, setAreLinesConverged] = useState(false);
  const [isBurgerRotated, setIsBurgerRotated] = useState(false);

  const prevIsMenuOpenRef = useRef(isMenuOpen);

  /* eslint-disable react-hooks/set-state-in-effect -- координаты для пошаговой анимации бургера */
  useEffect(() => {
    const prevIsMenuOpen = prevIsMenuOpenRef.current;
    prevIsMenuOpenRef.current = isMenuOpen;

    if (prevIsMenuOpen === isMenuOpen) return;

    if (prefersReducedMotion) {
      setAreLinesConverged(isMenuOpen);
      setIsBurgerRotated(isMenuOpen);
      return;
    }

    let timer: number | undefined;
    const frameId = window.requestAnimationFrame(() => {
      if (isMenuOpen) {
        setAreLinesConverged(true);
        setIsBurgerRotated(false);
        timer = window.setTimeout(() => setIsBurgerRotated(true), 120);
      } else {
        setIsBurgerRotated(false);
        setAreLinesConverged(true);
        timer = window.setTimeout(() => setAreLinesConverged(false), 120);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timer) window.clearTimeout(timer);
    };
  }, [isMenuOpen, prefersReducedMotion]);
  /* eslint-enable react-hooks/set-state-in-effect -- возвращаем правило после анимации */

  useEffect(() => {
    // Если мы вышли из burger-режима (например, расширили окно),
    // а меню было открыто — закрываем его.
    if (!isBurgerMode && isMenuOpen) {
      const frame = window.requestAnimationFrame(onRequestClose);
      return () => window.cancelAnimationFrame(frame);
    }
  }, [isBurgerMode, isMenuOpen, onRequestClose]);

  return {
    areLinesConverged,
    isBurgerRotated,
    topLineTransform: BURGER_TRANSFORM.top(areLinesConverged, isBurgerRotated),
    bottomLineTransform: BURGER_TRANSFORM.bottom(areLinesConverged, isBurgerRotated),
  } as const;
}
