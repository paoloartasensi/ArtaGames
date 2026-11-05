import { useEffect, useState } from 'react';

/**
 * Largest square (in px) that fits the viewport after reserving room for the controls.
 * Pixel sizes are used on purpose: % heights inside flex items don't work on Safari 9.
 */
export function useFitSize(reserveHeight: number, maxSize = 560, reserveWidth = 24): number {
  const compute = () => {
    const w = (typeof window !== 'undefined' ? window.innerWidth : 800) - reserveWidth;
    const h = (typeof window !== 'undefined' ? window.innerHeight : 800) - reserveHeight;
    return Math.max(180, Math.floor(Math.min(w, h, maxSize)));
  };
  const [size, setSize] = useState(compute);

  useEffect(() => {
    const onResize = () => setSize(compute());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reserveHeight, maxSize, reserveWidth]);

  return size;
}
