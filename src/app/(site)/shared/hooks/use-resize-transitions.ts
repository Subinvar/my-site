import { useEffect, useState } from "react";

export function useResizeTransitions() {
  const [transitionsOn, setTransitionsOn] = useState(false);

  useEffect(() => {
    // Включаем анимации после первого кадра (после гидрации),
    // чтобы не ловить нежелательные переходы на самом первом рендере.
    const raf = window.requestAnimationFrame(() => setTransitionsOn(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return transitionsOn;
}
