import { useEffect, type DependencyList } from "react";

type UseWindowResizeOptions = {
  listenerOptions?: AddEventListenerOptions;
  immediate?: boolean;
  disabled?: boolean;
  target?: Pick<EventTarget, "addEventListener" | "removeEventListener"> | null;
};

export function useWindowResize(
  onResize: (event: UIEvent) => void,
  deps: DependencyList = [],
  { listenerOptions = { passive: true }, immediate = false, disabled = false, target }: UseWindowResizeOptions = {},
) {
  useEffect(() => {
    const eventTarget = target ?? (typeof window !== "undefined" ? window : null);
    if (!eventTarget || disabled) return;

    const handler = (event: Event) => onResize(event as UIEvent);

    if (immediate) handler(new Event("resize"));

    eventTarget.addEventListener("resize", handler, listenerOptions);

    return () => eventTarget.removeEventListener("resize", handler, listenerOptions);
  }, deps);
}
