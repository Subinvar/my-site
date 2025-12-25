import { useEffect, type RefObject } from "react";

type UseIntersectionOptions = IntersectionObserverInit & {
  disabled?: boolean;
  Observer?: typeof IntersectionObserver;
};

export function useIntersection(
  targetRef: RefObject<Element | null>,
  onIntersect: (entry: IntersectionObserverEntry) => void,
  { disabled = false, Observer = typeof IntersectionObserver !== "undefined" ? IntersectionObserver : undefined, ...options }: UseIntersectionOptions = {},
) {
  useEffect(() => {
    const element = targetRef.current;
    if (!element || disabled || !Observer) return;

    const observer = new Observer((entries) => {
      entries.forEach((entry) => onIntersect(entry));
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
  }, [
    targetRef,
    onIntersect,
    disabled,
    Observer,
    options,
    options.root,
    options.rootMargin,
    options.threshold,
  ]);
}
