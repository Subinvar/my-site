import { useEffect, type RefObject } from "react";

export type UseIntersectionOptions = {
  Observer?: typeof IntersectionObserver | null;
  observerInit?: IntersectionObserverInit;
  disabled?: boolean;
};

export type UseIntersectionHandler = (
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver,
) => void;

export function useIntersection(
  targetRef: RefObject<Element | null>,
  onIntersect: UseIntersectionHandler,
  { Observer = typeof IntersectionObserver !== "undefined" ? IntersectionObserver : null, observerInit, disabled = false }: UseIntersectionOptions = {},
) {
  useEffect(() => {
    const element = targetRef.current;
    if (!element || disabled || !Observer) return;

    const observer = new Observer((entries, observerInstance) => {
      const [entry] = entries;
      if (entry) onIntersect(entry, observerInstance);
    }, observerInit);
    observer.observe(element);

    return () => observer.disconnect();
  }, [Observer, disabled, observerInit, onIntersect, targetRef]);
}