'use client';

import { useEffect, useState } from 'react';

type Options = {
  end: number;
  duration?: number; // ms
  start?: number;
  inView?: boolean;
};

export function useCountUp({ end, duration = 1200, start = 0, inView = true }: Options) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    if (!inView) return;

    let frame: number;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const next = Math.round(start + (end - start) * progress);
      setValue(next);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [start, end, duration, inView]);

  return value;
}
