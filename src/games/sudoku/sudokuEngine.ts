import { Difficulty } from '../../types/game';

export interface SudokuConfig {
  size: number;
  boxRows: number; // rows per box
  boxCols: number; // columns per box
  holes: number; // empty cells to aim for
}

export const SUDOKU_CONFIGS: Record<Difficulty, SudokuConfig> = {
  easy: { size: 4, boxRows: 2, boxCols: 2, holes: 9 },
  medium: { size: 6, boxRows: 2, boxCols: 3, holes: 18 },
  hard: { size: 9, boxRows: 3, boxCols: 3, holes: 44 },
  master: { size: 9, boxRows: 3, boxCols: 3, holes: 52 },
};

export interface SudokuPuzzle {
  config: SudokuConfig;
  solution: number[][];
  given: boolean[][];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** A valid full grid built from the classic shifting pattern, then shuffled. */
function randomSolution({ size, boxRows, boxCols }: SudokuConfig): number[][] {
  const pattern = (r: number, c: number) => (boxCols * (r % boxRows) + Math.floor(r / boxRows) + c) % size;

  const bands = size / boxRows; // groups of rows
  const stacks = size / boxCols; // groups of columns
  const rows = shuffle(range(bands)).flatMap((b) => shuffle(range(boxRows)).map((r) => b * boxRows + r));
  const cols = shuffle(range(stacks)).flatMap((s) => shuffle(range(boxCols)).map((c) => s * boxCols + c));
  const digits = shuffle(range(size).map((d) => d + 1));

  return rows.map((r) => cols.map((c) => digits[pattern(r, c)]));
}

export function canPlace(grid: number[][], cfg: SudokuConfig, r: number, c: number, v: number): boolean {
  for (let i = 0; i < cfg.size; i++) {
    if (grid[r][i] === v && i !== c) return false;
    if (grid[i][c] === v && i !== r) return false;
  }
  const br = Math.floor(r / cfg.boxRows) * cfg.boxRows;
  const bc = Math.floor(c / cfg.boxCols) * cfg.boxCols;
  for (let rr = br; rr < br + cfg.boxRows; rr++) {
    for (let cc = bc; cc < bc + cfg.boxCols; cc++) {
      if (grid[rr][cc] === v && (rr !== r || cc !== c)) return false;
    }
  }
  return true;
}

/** Counts solutions up to `limit` (0 = empty cell). */
export function countSolutions(grid: number[][], cfg: SudokuConfig, limit = 2): number {
  const g = grid.map((row) => [...row]);
  let count = 0;

  const solve = (): boolean => {
    // Pick the empty cell with the fewest candidates
    let bestR = -1;
    let bestC = -1;
    let bestCands: number[] = [];
    for (let r = 0; r < cfg.size; r++) {
      for (let c = 0; c < cfg.size; c++) {
        if (g[r][c] !== 0) continue;
        const cands: number[] = [];
        for (let v = 1; v <= cfg.size; v++) if (canPlace(g, cfg, r, c, v)) cands.push(v);
        if (cands.length === 0) return false;
        if (bestR === -1 || cands.length < bestCands.length) {
          bestR = r;
          bestC = c;
          bestCands = cands;
        }
      }
    }
    if (bestR === -1) {
      count++;
      return count >= limit;
    }
    for (const v of bestCands) {
      g[bestR][bestC] = v;
      if (solve()) return true;
    }
    g[bestR][bestC] = 0;
    return false;
  };

  solve();
  return count;
}

/** New puzzle with exactly one solution. */
export function createSudoku(difficulty: Difficulty): SudokuPuzzle {
  const config = SUDOKU_CONFIGS[difficulty];
  const solution = randomSolution(config);
  const grid = solution.map((row) => [...row]);
  let removed = 0;

  for (const idx of shuffle(range(config.size * config.size))) {
    if (removed >= config.holes) break;
    const r = Math.floor(idx / config.size);
    const c = idx % config.size;
    const keep = grid[r][c];
    grid[r][c] = 0;
    if (countSolutions(grid, config, 2) === 1) removed++;
    else grid[r][c] = keep;
  }

  return { config, solution, given: grid.map((row) => row.map((v) => v !== 0)) };
}
