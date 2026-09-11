import { useEffect, useState } from 'react';

export default function useCanvasSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({
        width: rect.width,
        height: rect.height,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ref]);

  return size;
}
