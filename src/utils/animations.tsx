import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, type Transition } from 'motion/react';

// Short + subtle for a kids game.
export const SLIDE: Transition = { duration: 0.25, ease: 'easeOut' };
export const FADE: Transition = { duration: 0.2, ease: 'easeOut' };

/**
 * Monotonic counter that bumps whenever `signal` becomes a *new* non-null value.
 * Use the result as a React `key` for capture ghosts so they re-trigger only on
 * a real move, never on unrelated re-renders.
 */
export function useMoveKey(signal: unknown): number {
  const [key, setKey] = useState(0);
  const prev = useRef(signal);
  useEffect(() => {
    if (signal !== null && signal !== undefined && signal !== prev.current) {
      prev.current = signal;
      setKey((k) => k + 1);
    }
  }, [signal]);
  return key;
}

interface GridSlidePieceProps {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  z?: number;
  children: ReactNode;
}

/**
 * Renders `children` filling one grid cell, flying in from (fromRow,fromCol).
 * 100% == one cell, because grid cells are square.
 */
export const GridSlidePiece: React.FC<GridSlidePieceProps> = ({
  fromRow,
  fromCol,
  toRow,
  toCol,
  z = 30,
  children,
}) => (
  <motion.div
    className="absolute inset-0 flex items-center justify-center"
    style={{ zIndex: z }}
    initial={{ x: `${(fromCol - toCol) * 100}%`, y: `${(fromRow - toRow) * 100}%` }}
    animate={{ x: '0%', y: '0%' }}
    transition={SLIDE}
  >
    {children}
  </motion.div>
);
