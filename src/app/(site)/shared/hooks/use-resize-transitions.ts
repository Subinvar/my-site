import { useEffect, useState } from "react";

export function useResizeTransitions() {
  const [transitionsOn, setTransitionsOn] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    const onResize = () => {
      setTransitionsOn(true);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setTransitionsOn(false), 350);
    };

    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return transitionsOn;
}
