import { useEffect, useRef, useState } from "react";

import { useWindowResize } from "./use-window-resize";

export function useResizeTransitions() {
  const [transitionsOn, setTransitionsOn] = useState(false);
  const timerRef = useRef<number | undefined>();

  useWindowResize(
    () => {
      setTransitionsOn(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setTransitionsOn(false), 350);
    },
    [],
    { listenerOptions: { passive: true } },
  );

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return transitionsOn;
}
