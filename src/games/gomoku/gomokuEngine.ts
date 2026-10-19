import { Difficulty } from '../../types/game';

export type GomokuPlayer = 0 | 1;
export type GomokuCell = GomokuPlayer | null;

export const GOMOKU_SIZE = 9;

export interface GomokuState {
  board: GomokuCell[][];
  turn: GomokuPlayer;
  gameOver: boolean;
  winner: GomokuPlayer | 'draw' | null;
  winningLine: { r: number; c: number }[] | null;
  lastMove: { r: number; c: number } | null;
}

export function createInitialGomokuState(): GomokuState {
  return {
    board: Array.from({ length: GOMOKU_SIZE }, () => Array(GOMOKU_SIZE).fill(null)),
    turn: 0,
    gameOver: false,
    winner: null,
    winningLine: null,
    lastMove: null,
  };
}

// 4 axes: horizontal, vertical, and the two diagonals.
const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function checkGomokuWin(
  board: GomokuCell[][],
): { winner: GomokuPlayer; line: { r: number; c: number }[] } | null {
  for (let r = 0; r < GOMOKU_SIZE; r++) {
    for (let c = 0; c < GOMOKU_SIZE; c++) {
      const p = board[r][c];
      if (p === null) continue;
      for (const [dr, dc] of DIRS) {
        // Only start counting from the beginning of a run.
        const pr = r - dr;
        const pc = c - dc;
        if (pr >= 0 && pr < GOMOKU_SIZE && pc >= 0 && pc < GOMOKU_SIZE && board[pr][pc] === p) continue;
        const line: { r: number; c: number }[] = [];
        let rr = r;
        let cc = c;
        while (rr >= 0 && rr < GOMOKU_SIZE && cc >= 0 && cc < GOMOKU_SIZE && board[rr][cc] === p) {
          line.push({ r: rr, c: cc });
          rr += dr;
          cc += dc;
        }
        if (line.length >= 5) return { winner: p, line };
      }
    }
  }
  return null;
}

export function playGomokuMove(state: GomokuState, r: number, c: number): GomokuState | null {
  if (state.gameOver || r < 0 || r >= GOMOKU_SIZE || c < 0 || c >= GOMOKU_SIZE) return null;
  if (state.board[r][c] !== null) return null;

  const board = state.board.map((row) => [...row]);
  board[r][c] = state.turn;

  const win = checkGomokuWin(board);
  const full = board.every((row) => row.every((x) => x !== null));

  return {
    board,
    turn: (1 - state.turn) as GomokuPlayer,
    gameOver: !!win || full,
    winner: win ? win.winner : full ? 'draw' : null,
    winningLine: win ? win.line : null,
    lastMove: { r, c },
  };
}

function countRun(
  board: GomokuCell[][],
  r: number,
  c: number,
  dr: number,
  dc: number,
  player: GomokuPlayer,
): { count: number; openEnds: number } {
  let count = 0;
  let openEnds = 0;

  let rr = r;
  let cc = c;
  while (rr >= 0 && rr < GOMOKU_SIZE && cc >= 0 && cc < GOMOKU_SIZE && board[rr][cc] === player) {
    count++;
    rr += dr;
    cc += dc;
  }
  if (rr >= 0 && rr < GOMOKU_SIZE && cc >= 0 && cc < GOMOKU_SIZE && board[rr][cc] === null) openEnds++;

  rr = r - dr;
  cc = c - dc;
  while (rr >= 0 && rr < GOMOKU_SIZE && cc >= 0 && cc < GOMOKU_SIZE && board[rr][cc] === player) {
    count++;
    rr -= dr;
    cc -= dc;
  }
  if (rr >= 0 && rr < GOMOKU_SIZE && cc >= 0 && cc < GOMOKU_SIZE && board[rr][cc] === null) openEnds++;

  return { count, openEnds };
}

function scoreCell(board: GomokuCell[][], r: number, c: number, player: GomokuPlayer): number {
  let total = 0;
  for (const [dr, dc] of DIRS) {
    const { count, openEnds } = countRun(board, r, c, dr, dc, player);
    if (count >= 5) total += 100000;
    else {
      const base = [0, 2, 20, 200, 2000][Math.min(count, 4)];
      const mult = openEnds === 2 ? 1.3 : openEnds === 1 ? 0.9 : 0.3;
      total += base * mult;
    }
  }
  return total;
}

function centerBonus(r: number, c: number): number {
  const mid = (GOMOKU_SIZE - 1) / 2;
  const dist = Math.abs(r - mid) + Math.abs(c - mid);
  return (GOMOKU_SIZE - dist) * 1.5;
}

export function getBotGomokuMove(state: GomokuState, difficulty: Difficulty): { r: number; c: number } {
  const empty: { r: number; c: number }[] = [];
  for (let r = 0; r < GOMOKU_SIZE; r++)
    for (let c = 0; c < GOMOKU_SIZE; c++) if (state.board[r][c] === null) empty.push({ r, c });
  if (empty.length === 0) return { r: 0, c: 0 };

  const bot = state.turn;
  const opp = (1 - bot) as GomokuPlayer;

  // 1. Win now.
  for (const { r, c } of empty) {
    const b = state.board.map((row) => [...row]);
    b[r][c] = bot;
    if (checkGomokuWin(b)) return { r, c };
  }

  // 2. Block opponent's immediate win.
  for (const { r, c } of empty) {
    const b = state.board.map((row) => [...row]);
    b[r][c] = opp;
    if (checkGomokuWin(b)) return { r, c };
  }

  if (difficulty === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // 3. Heuristic: attack + defend + prefer center.
  let best = empty[0];
  let bestScore = -Infinity;
  const defendWeight = difficulty === 'medium' ? 0.9 : 1.1;
  for (const { r, c } of empty) {
    const attack = scoreCell(state.board, r, c, bot);
    const defend = scoreCell(state.board, r, c, opp);
    const s = attack + defend * defendWeight + centerBonus(r, c) + Math.random() * 2;
    if (s > bestScore) {
      bestScore = s;
      best = { r, c };
    }
  }
  return best;
}
