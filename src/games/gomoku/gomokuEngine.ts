import { Difficulty } from '../../types/game';

export type GomokuPlayer = 0 | 1;
export type GomokuCell = GomokuPlayer | null;

export interface GomokuState {
  size: number;
  board: GomokuCell[][];
  turn: GomokuPlayer;
  gameOver: boolean;
  winner: GomokuPlayer | 'draw' | null;
  winningLine: { r: number; c: number }[] | null;
  lastMove: { r: number; c: number } | null;
}

export function createInitialGomokuState(size = 9): GomokuState {
  return {
    size,
    board: Array.from({ length: size }, () => Array(size).fill(null)),
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
  size: number,
): { winner: GomokuPlayer; line: { r: number; c: number }[] } | null {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const p = board[r][c];
      if (p === null) continue;
      for (const [dr, dc] of DIRS) {
        // Only start counting from the beginning of a run.
        const pr = r - dr;
        const pc = c - dc;
        if (pr >= 0 && pr < size && pc >= 0 && pc < size && board[pr][pc] === p) continue;
        const line: { r: number; c: number }[] = [];
        let rr = r;
        let cc = c;
        while (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === p) {
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
  const { size } = state;
  if (state.gameOver || r < 0 || r >= size || c < 0 || c >= size) return null;
  if (state.board[r][c] !== null) return null;

  const board = state.board.map((row) => [...row]);
  board[r][c] = state.turn;

  const win = checkGomokuWin(board, size);
  const full = board.every((row) => row.every((x) => x !== null));

  return {
    ...state,
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
  size: number,
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
  while (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === player) {
    count++;
    rr += dr;
    cc += dc;
  }
  if (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === null) openEnds++;

  rr = r - dr;
  cc = c - dc;
  while (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === player) {
    count++;
    rr -= dr;
    cc -= dc;
  }
  if (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === null) openEnds++;

  return { count, openEnds };
}

function scoreCell(board: GomokuCell[][], size: number, r: number, c: number, player: GomokuPlayer): number {
  let total = 0;
  for (const [dr, dc] of DIRS) {
    const { count, openEnds } = countRun(board, size, r, c, dr, dc, player);
    if (count >= 5) total += 100000;
    else {
      const base = [0, 2, 20, 200, 2000][Math.min(count, 4)];
      const mult = openEnds === 2 ? 1.3 : openEnds === 1 ? 0.9 : 0.3;
      total += base * mult;
    }
  }
  return total;
}

function centerBonus(size: number, r: number, c: number): number {
  const mid = (size - 1) / 2;
  const dist = Math.abs(r - mid) + Math.abs(c - mid);
  return (size - dist) * 1.5;
}

export function getBotGomokuMove(state: GomokuState, difficulty: Difficulty): { r: number; c: number } {
  const { size, board } = state;
  const empty: { r: number; c: number }[] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (board[r][c] === null) empty.push({ r, c });
  if (empty.length === 0) return { r: 0, c: 0 };

  const bot = state.turn;
  const opp = (1 - bot) as GomokuPlayer;

  // 1. Win now.
  for (const { r, c } of empty) {
    const b = board.map((row) => [...row]);
    b[r][c] = bot;
    if (checkGomokuWin(b, size)) return { r, c };
  }

  // 2. Block opponent's immediate win.
  for (const { r, c } of empty) {
    const b = board.map((row) => [...row]);
    b[r][c] = opp;
    if (checkGomokuWin(b, size)) return { r, c };
  }

  if (difficulty === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // 3. Heuristic: attack + defend + prefer center.
  let best = empty[0];
  let bestScore = -Infinity;
  const defendWeight = difficulty === 'medium' ? 0.9 : 1.1;
  for (const { r, c } of empty) {
    const attack = scoreCell(board, size, r, c, bot);
    const defend = scoreCell(board, size, r, c, opp);
    const s = attack + defend * defendWeight + centerBonus(size, r, c) + Math.random() * 2;
    if (s > bestScore) {
      bestScore = s;
      best = { r, c };
    }
  }
  return best;
}
