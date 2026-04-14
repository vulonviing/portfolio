import { useEffect, useRef } from 'react';

export default function useAnimationFrame(callback, active = true) {
  const cbRef = useRef(callback);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return undefined;

    startRef.current = performance.now();
    lastRef.current = startRef.current;

    const tick = (now) => {
      const delta = (now - lastRef.current) / 1000;
      const elapsed = (now - startRef.current) / 1000;
      lastRef.current = now;
      cbRef.current?.({ delta, elapsed, now });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);
}
