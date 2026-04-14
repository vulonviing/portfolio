import { useEffect, useRef } from 'react';
import useCanvasSize from './useCanvasSize';

export default function useCanvas(draw, deps = []) {
  const canvasRef = useRef(null);
  const size = useCanvasSize(canvasRef);
  const drawRef = useRef(draw);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.width || !size.height) return;

    const { dpr } = size;
    canvas.width = Math.floor(size.width * dpr);
    canvas.height = Math.floor(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, size.dpr]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    let raf = 0;
    const tick = (now) => {
      drawRef.current?.({
        ctx,
        width: size.width,
        height: size.height,
        time: now / 1000,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, ...deps]);

  return { canvasRef, size };
}
