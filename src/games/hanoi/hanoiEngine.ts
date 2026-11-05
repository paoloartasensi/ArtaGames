import { Difficulty } from '../../types/game';

export const HANOI_DISKS: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5, master: 6 };

/** towers[t] lists disk sizes bottom → top (bigger number = bigger disk). */
export type Towers = number[][];

export function createTowers(disks: number): Towers {
  return [Array.from({ length: disks }, (_, i) => disks - i), [], []];
}

export function canMove(towers: Towers, from: number, to: number): boolean {
  if (from === to) return false;
  const src = towers[from];
  if (src.length === 0) return false;
  const dst = towers[to];
  return dst.length === 0 || dst[dst.length - 1] > src[src.length - 1];
}

export function moveDisk(towers: Towers, from: number, to: number): Towers | null {
  if (!canMove(towers, from, to)) return null;
  const next = towers.map((t) => [...t]);
  next[to].push(next[from].pop() as number);
  return next;
}

/** Solved when every disk sits on the last tower. */
export function isHanoiSolved(towers: Towers, disks: number): boolean {
  return towers[2].length === disks;
}

export function minMoves(disks: number): number {
  return Math.pow(2, disks) - 1;
}
