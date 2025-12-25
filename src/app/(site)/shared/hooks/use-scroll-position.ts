import { useEffect, type DependencyList } from "react";

type UseScrollPositionOptions = {
  listenerOptions?: AddEventListenerOptions;
  immediate?: boolean;
  disabled?: boolean;
  target?: Pick<EventTarget, "addEventListener" | "removeEventListener"> | null;
};

export function useScrollPosition(
  onScroll: (event: Event) => void,
  deps: DependencyList = [],
  { listenerOptions = { passive: true }, immediate = true, disabled = false, target }: UseScrollPositionOptions = {},
) {
  useEffect(() => {
    const eventTarget = target ?? (typeof window !== "undefined" ? window : null);
    if (!eventTarget || disabled) return;

    const handler = (event: Event) => onScroll(event);

    if (immediate) handler(new Event("scroll"));

    eventTarget.addEventListener("scroll", handler, listenerOptions);

    return () => eventTarget.removeEventListener("scroll", handler, listenerOptions);
  }, deps);
}
