import { Difficulty } from '../../types/game';

export type LudoPlayer = 0 | 1;

export interface LudoState {
  // tokens[player][i] = -1 in base, 0..50 on track, 51..55 home column, 56 finished
  tokens: [number[], number[]];
  turn: LudoPlayer;
  phase: 'roll' | 'move';
  dice: number | null;
  movable: number[];
  gameOver: boolean;
  winner: LudoPlayer | null;
  lastMove: {
    player: LudoPlayer;
    token: number;
    from: number;
    to: number;
    captured: number;
    extraTurn: boolean;
    finished: boolean;
  } | null;
  message: string | null;
}

// --- Board geometry: a 15x15 grid, row 0 = top, col 0 = left ---
// The 52 shared track cells, clockwise, starting from the top-left start cell.
export const TRACK: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];

// Player 0 = Blu (top-right base), Player 1 = Rosso (bottom-left base).
// Opposite corners, matching the official Offline Games board orientation.
export const START_INDEX: [number, number] = [13, 39];

// Home columns: 5 cells each, ordered from the track toward the centre.
export const HOME_COLUMNS: [[number, number][], [number, number][]] = [
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]], // Blu (coming down from top)
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]], // Rosso (coming up from bottom)
];

// The four start cells (A-fields) are the safe squares of the original board:
// tokens on them can never be captured. Indices 0, 13, 26, 39.
export const SAFE_CELLS = new Set([0, 13, 26, 39]);

export const FINISH_POS = 56; // reached the home centre

function other(p: LudoPlayer): LudoPlayer {
  return (1 - p) as LudoPlayer;
}

function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

export function createInitialLudoState(): LudoState {
  return {
    tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1]],
    turn: 0,
    phase: 'roll',
    dice: null,
    movable: [],
    gameOver: false,
    winner: null,
    lastMove: null,
    message: null,
  };
}

function computeMovable(tokens: [number[], number[]], player: LudoPlayer, dice: number): number[] {
  const res: number[] = [];
  tokens[player].forEach((pos, i) => {
    if (pos === -1) {
      // A piece in base only leaves on a 6.
      if (dice === 6) res.push(i);
    } else if (pos + dice <= FINISH_POS) {
      // Moving must land exactly on the finish, never overshoot it.
      res.push(i);
    }
  });
  return res;
}

export function rollLudo(state: LudoState): LudoState | null {
  if (state.gameOver || state.phase !== 'roll') return null;

  const dice = rollDie();
  const movable = computeMovable(state.tokens, state.turn, dice);

  if (movable.length === 0) {
    return {
      ...state,
      dice,
      movable: [],
      phase: 'roll',
      turn: other(state.turn),
      lastMove: null,
      message: 'Nessuna pedina può muoversi: passa il turno!',
    };
  }

  return { ...state, dice, movable, phase: 'move', lastMove: null, message: null };
}

export function moveLudo(state: LudoState, tokenIndex: number): LudoState | null {
  if (state.gameOver || state.phase !== 'move') return null;
  if (!state.movable.includes(tokenIndex)) return null;

  const player = state.turn;
  const dice = state.dice as number;
  const tokens = state.tokens.map((arr) => [...arr]) as [number[], number[]];

  const from = tokens[player][tokenIndex];
  const to = from === -1 ? 0 : from + dice;
  tokens[player][tokenIndex] = to;

  // Capture: landing on an opponent's piece (outside a safe cell) sends it home.
  let captured = 0;
  if (to >= 0 && to <= 50) {
    const abs = (START_INDEX[player] + to) % 52;
    if (!SAFE_CELLS.has(abs)) {
      const opp = other(player);
      const oppStart = START_INDEX[opp];
      tokens[opp] = tokens[opp].map((p) => {
        if (p >= 0 && p <= 50 && (oppStart + p) % 52 === abs) {
          captured += 1;
          return -1;
        }
        return p;
      });
    }
  }

  const finished = tokens[player].filter((p) => p === FINISH_POS).length;
  const gameOver = finished === 4;
  // Rolling a 6 or capturing a piece grants another turn.
  const extraTurn = dice === 6 || captured > 0;

  return {
    ...state,
    tokens,
    turn: gameOver ? player : extraTurn ? player : other(player),
    phase: 'roll',
    dice: null,
    movable: [],
    gameOver,
    winner: gameOver ? player : null,
    lastMove: {
      player,
      token: tokenIndex,
      from,
      to,
      captured,
      extraTurn,
      finished: to === FINISH_POS,
    },
    message: null,
  };
}

export function getBotLudoMove(state: LudoState, difficulty: Difficulty): number {
  const movable = state.movable;
  if (movable.length === 0) return -1;

  if (difficulty === 'easy') {
    return movable[Math.floor(Math.random() * movable.length)];
  }

  const player = state.turn;
  let best = movable[0];
  let bestScore = -Infinity;

  for (const idx of movable) {
    const next = moveLudo(state, idx);
    if (!next) continue;

    let score = 0;
    const pos = next.tokens[player][idx];

    if (next.lastMove?.finished) score += 14;
    if (next.lastMove?.captured) score += next.lastMove.captured * 8;
    if (pos >= 0 && pos <= 50 && SAFE_CELLS.has((START_INDEX[player] + pos) % 52)) score += 3;
    if (next.lastMove && next.lastMove.from === -1) score += 2; // bring a piece out
    score += pos * 0.15; // prefer advancing the lead piece
    score += Math.random() * (difficulty === 'master' ? 0.3 : 1.5);

    if (score > bestScore) {
      bestScore = score;
      best = idx;
    }
  }

  return best;
}
