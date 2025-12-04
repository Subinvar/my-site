'use client';

import { useEffect, useRef, useState } from 'react';

type Options = {
  rootMargin?: string;
  once?: boolean;
};

export function useInView<T extends HTMLElement = HTMLElement>({
  rootMargin = '-10% 0px',
  once = true,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin },
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [rootMargin, once]);

  return { ref, inView };
}
