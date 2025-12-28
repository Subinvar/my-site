import { useEffect } from "react";

type UseScrollPositionOptions = {
  listenerOptions?: AddEventListenerOptions;
  immediate?: boolean;
  disabled?: boolean;
  target?: Pick<EventTarget, "addEventListener" | "removeEventListener"> | null;
};

export function useScrollPosition(
  onScroll: (event: UIEvent) => void,
  { listenerOptions = { passive: true }, immediate = true, disabled = false, target }: UseScrollPositionOptions = {},
) {
  useEffect(() => {
    const eventTarget = target ?? (typeof window !== "undefined" ? window : null);
    if (!eventTarget || disabled) return;

    const handler = (event: Event) => onScroll(event as UIEvent);

    if (immediate) handler(new Event("scroll"));

    eventTarget.addEventListener("scroll", handler, listenerOptions);

    return () => eventTarget.removeEventListener("scroll", handler, listenerOptions);
  }, [onScroll, disabled, immediate, listenerOptions, target]);
}