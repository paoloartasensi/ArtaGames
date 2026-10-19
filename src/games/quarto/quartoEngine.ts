import { Difficulty } from '../../types/game';

export interface QuartoPiece {
  id: number;
  tall: boolean;
  dark: boolean;
  round: boolean;
  hollow: boolean;
}

export type QuartoCell = QuartoPiece | null;

export interface QuartoState {
  board: QuartoCell[][]; // 4x4
  available: QuartoPiece[];
  currentPick: QuartoPiece | null;
  turn: 0 | 1; // whose turn to act (pick, then the opponent places)
  phase: 'pick' | 'place';
  gameOver: boolean;
  winner: 0 | 1 | 'draw' | null;
  winningLine: { r: number; c: number }[] | null;
}

const ALL_LINES: { r: number; c: number }[][] = (() => {
  const lines: { r: number; c: number }[][] = [];
  for (let r = 0; r < 4; r++) lines.push([{ r, c: 0 }, { r, c: 1 }, { r, c: 2 }, { r, c: 3 }]);
  for (let c = 0; c < 4; c++) lines.push([{ r: 0, c }, { r: 1, c }, { r: 2, c }, { r: 3, c }]);
  lines.push([{ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 3 }]);
  lines.push([{ r: 0, c: 3 }, { r: 1, c: 2 }, { r: 2, c: 1 }, { r: 3, c: 0 }]);
  return lines;
})();

export function createAllQuartoPieces(): QuartoPiece[] {
  const pieces: QuartoPiece[] = [];
  let id = 0;
  for (const tall of [false, true]) {
    for (const dark of [false, true]) {
      for (const round of [false, true]) {
        for (const hollow of [false, true]) {
          pieces.push({ id: id++, tall, dark, round, hollow });
        }
      }
    }
  }
  return pieces;
}

export function createInitialQuartoState(): QuartoState {
  return {
    board: Array.from({ length: 4 }, () => Array(4).fill(null) as QuartoCell[]),
    available: createAllQuartoPieces(),
    currentPick: null,
    turn: 0,
    phase: 'pick',
    gameOver: false,
    winner: null,
    winningLine: null,
  };
}

function shareAttribute(cells: (QuartoPiece | null)[]): boolean {
  if (cells.some((c) => !c)) return false;
  const c0 = cells[0] as QuartoPiece;
  return (
    cells.every((c) => (c as QuartoPiece).tall === c0.tall) ||
    cells.every((c) => (c as QuartoPiece).dark === c0.dark) ||
    cells.every((c) => (c as QuartoPiece).round === c0.round) ||
    cells.every((c) => (c as QuartoPiece).hollow === c0.hollow)
  );
}

function findWinLine(board: QuartoCell[][]): { r: number; c: number }[] | null {
  for (const line of ALL_LINES) {
    const cells = line.map((p) => board[p.r][p.c]);
    if (shareAttribute(cells)) return line;
  }
  return null;
}

export function pickQuarto(state: QuartoState, pieceId: number): QuartoState | null {
  if (state.gameOver || state.phase !== 'pick') return null;
  const piece = state.available.find((p) => p.id === pieceId);
  if (!piece) return null;
  return {
    ...state,
    available: state.available.filter((p) => p.id !== pieceId),
    currentPick: piece,
    phase: 'place',
  };
}

export function placeQuarto(state: QuartoState, r: number, c: number): QuartoState | null {
  if (state.gameOver || state.phase !== 'place' || !state.currentPick) return null;
  if (r < 0 || r > 3 || c < 0 || c > 3 || state.board[r][c] !== null) return null;

  const board = state.board.map((row) => [...row]);
  board[r][c] = state.currentPick;

  const placer = (1 - state.turn) as 0 | 1;
  const line = findWinLine(board);

  if (line) {
    return {
      ...state,
      board,
      currentPick: null,
      gameOver: true,
      winner: placer,
      winningLine: line,
      phase: 'pick',
    };
  }

  const full = board.every((row) => row.every((cell) => cell !== null));
  if (full) {
    return {
      ...state,
      board,
      currentPick: null,
      gameOver: true,
      winner: 'draw',
      winningLine: null,
      phase: 'pick',
    };
  }

  return { ...state, board, currentPick: null, turn: placer, phase: 'pick' };
}

function countThreats(board: QuartoCell[][]): number {
  let n = 0;
  for (const line of ALL_LINES) {
    const cells = line.map((p) => board[p.r][p.c]);
    const filled = cells.filter((c) => c !== null);
    if (filled.length === 3 && shareAttribute(cells)) n++;
  }
  return n;
}

/** The BOT picks a piece for the opponent to place: avoid giving away an immediate win. */
export function getBotQuartoPick(state: QuartoState, difficulty: Difficulty): number {
  const pieces = state.available;
  if (pieces.length === 0) return -1;
  if (difficulty === 'easy') {
    return pieces[Math.floor(Math.random() * pieces.length)].id;
  }

  const safe: QuartoPiece[] = [];
  for (const p of pieces) {
    let dangerous = false;
    for (let r = 0; r < 4 && !dangerous; r++) {
      for (let c = 0; c < 4; c++) {
        if (state.board[r][c] !== null) continue;
        const board = state.board.map((row) => [...row]);
        board[r][c] = p;
        if (findWinLine(board)) {
          dangerous = true;
          break;
        }
      }
    }
    if (!dangerous) safe.push(p);
  }

  if (safe.length > 0) return safe[Math.floor(Math.random() * safe.length)].id;
  return pieces[Math.floor(Math.random() * pieces.length)].id;
}

/** The BOT places the piece it was given. */
export function getBotQuartoPlace(state: QuartoState, difficulty: Difficulty): { r: number; c: number } {
  const empties: { r: number; c: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (state.board[r][c] === null) empties.push({ r, c });
    }
  }
  if (empties.length === 0) return { r: 0, c: 0 };

  const piece = state.currentPick!;

  // Win immediately if possible.
  for (const cell of empties) {
    const board = state.board.map((row) => [...row]);
    board[cell.r][cell.c] = piece;
    if (findWinLine(board)) return cell;
  }

  if (difficulty === 'easy') {
    return empties[Math.floor(Math.random() * empties.length)];
  }

  let best = empties[0];
  let bestScore = -Infinity;
  for (const cell of empties) {
    const board = state.board.map((row) => [...row]);
    board[cell.r][cell.c] = piece;
    const threats = countThreats(board);
    const score = threats + Math.random() * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = cell;
    }
  }
  return best;
}
