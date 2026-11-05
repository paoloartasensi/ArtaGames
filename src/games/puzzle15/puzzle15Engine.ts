import { Difficulty } from '../../types/game';

export const PUZZLE15_SIZES: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5, master: 5 };

/** tiles[i] = number on square i, 0 = the empty square. Solved = 1..n²-1 then 0. */
export function solvedTiles(n: number): number[] {
  return Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? 0 : i + 1));
}

export function isSolved(tiles: number[]): boolean {
  return tiles.every((v, i) => v === (i === tiles.length - 1 ? 0 : i + 1));
}

function neighbours(n: number, idx: number): number[] {
  const r = Math.floor(idx / n);
  const c = idx % n;
  const res: number[] = [];
  if (r > 0) res.push(idx - n);
  if (r < n - 1) res.push(idx + n);
  if (c > 0) res.push(idx - 1);
  if (c < n - 1) res.push(idx + 1);
  return res;
}

/** Shuffle by making random legal moves from the solved state, so it is always solvable. */
export function shuffledTiles(n: number): number[] {
  let tiles = solvedTiles(n);
  let empty = tiles.length - 1;
  let prev = -1;
  const steps = n * n * 25;
  for (let i = 0; i < steps; i++) {
    const options = neighbours(n, empty).filter((x) => x !== prev);
    const pick = options[Math.floor(Math.random() * options.length)];
    tiles[empty] = tiles[pick];
    tiles[pick] = 0;
    prev = empty;
    empty = pick;
  }
  if (isSolved(tiles)) tiles = shuffledTiles(n);
  return tiles;
}

/**
 * Tapping a tile in the same row/column as the gap slides the whole line toward the gap.
 * Returns the new tiles and how many tiles moved (0 if the tap does nothing).
 */
export function slideTiles(tiles: number[], n: number, idx: number): { tiles: number[]; moved: number } {
  const empty = tiles.indexOf(0);
  const er = Math.floor(empty / n);
  const ec = empty % n;
  const r = Math.floor(idx / n);
  const c = idx % n;
  if (idx === empty || (r !== er && c !== ec)) return { tiles, moved: 0 };

  const next = [...tiles];
  const step = r === er ? (c < ec ? -1 : 1) : c === ec ? (r < er ? -n : n) : 0;
  let gap = empty;
  let moved = 0;
  while (gap !== idx) {
    next[gap] = next[gap + step];
    next[gap + step] = 0;
    gap += step;
    moved++;
  }
  return { tiles: next, moved };
}
