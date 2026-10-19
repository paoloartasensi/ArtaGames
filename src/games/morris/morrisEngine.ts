import { Difficulty } from '../../types/game';

export type MorrisPlayer = 0 | 1;
export type MorrisCell = 0 | 1 | null;

export interface MorrisState {
  board: MorrisCell[]; // 24 points
  phase: 'placing' | 'moving';
  turn: MorrisPlayer;
  piecesToPlace: [number, number];
  piecesOnBoard: [number, number];
  selected: number | null;
  mustRemove: boolean;
  gameOver: boolean;
  winner: MorrisPlayer | null;
  lastMove: { from: number | null; to: number | null; removed: number | null };
}

export const MORRIS_POINTS = 24;

// Adjacency of the 24 points (outer 0-7, middle 8-15, inner 16-23).
export const MORRIS_ADJ: number[][] = [
  [1, 7, 8],          // 0
  [0, 2, 9],          // 1
  [1, 3, 10],         // 2
  [2, 4, 11],         // 3
  [3, 5, 12],         // 4
  [4, 6, 13],         // 5
  [5, 7, 14],         // 6
  [6, 0, 15],         // 7
  [0, 9, 15, 16],     // 8
  [1, 8, 10, 17],     // 9
  [2, 9, 11, 18],     // 10
  [3, 10, 12, 19],    // 11
  [4, 11, 13, 20],    // 12
  [5, 12, 14, 21],    // 13
  [6, 13, 15, 22],    // 14
  [7, 14, 8, 23],     // 15
  [8, 17, 23],        // 16
  [9, 16, 18],        // 17
  [10, 17, 19],       // 18
  [11, 18, 20],       // 19
  [12, 19, 21],       // 20
  [13, 20, 22],       // 21
  [14, 21, 23],       // 22
  [15, 22, 16],       // 23
];

// The 16 possible mills (three collinear points).
export const MORRIS_MILLS: number[][] = [
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
  [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
  [0, 8, 16], [1, 9, 17], [2, 10, 18], [3, 11, 19],
  [4, 12, 20], [5, 13, 21], [6, 14, 22], [7, 15, 23],
];

export function createInitialMorrisState(): MorrisState {
  return {
    board: new Array(MORRIS_POINTS).fill(null),
    phase: 'placing',
    turn: 0,
    piecesToPlace: [9, 9],
    piecesOnBoard: [0, 0],
    selected: null,
    mustRemove: false,
    gameOver: false,
    winner: null,
    lastMove: { from: null, to: null, removed: null },
  };
}

function isMill(board: MorrisCell[], point: number, player: MorrisPlayer): boolean {
  for (const mill of MORRIS_MILLS) {
    if (mill.includes(point) && mill.every((p) => board[p] === player)) {
      return true;
    }
  }
  return false;
}

export function getMorrisLegalMoves(
  board: MorrisCell[],
  player: MorrisPlayer,
  piecesOnBoard: number
): { from: number; to: number }[] {
  const moves: { from: number; to: number }[] = [];
  const flying = piecesOnBoard === 3;

  for (let i = 0; i < MORRIS_POINTS; i++) {
    if (board[i] !== player) continue;
    if (flying) {
      for (let j = 0; j < MORRIS_POINTS; j++) {
        if (board[j] === null) moves.push({ from: i, to: j });
      }
    } else {
      for (const j of MORRIS_ADJ[i]) {
        if (board[j] === null) moves.push({ from: i, to: j });
      }
    }
  }
  return moves;
}

export function placeMorris(state: MorrisState, point: number): MorrisState | null {
  if (state.gameOver || state.phase !== 'placing' || state.mustRemove) return null;
  if (point < 0 || point >= MORRIS_POINTS || state.board[point] !== null) return null;

  const board = [...state.board];
  board[point] = state.turn;

  const piecesOnBoard: [number, number] = [...state.piecesOnBoard] as [number, number];
  piecesOnBoard[state.turn]++;

  const piecesToPlace: [number, number] = [...state.piecesToPlace] as [number, number];
  piecesToPlace[state.turn]--;

  const phase = piecesToPlace[0] + piecesToPlace[1] === 0 ? 'moving' : 'placing';
  const mill = isMill(board, point, state.turn);

  if (mill) {
    return {
      ...state,
      board,
      piecesOnBoard,
      piecesToPlace,
      phase,
      mustRemove: true,
      lastMove: { from: null, to: point, removed: null },
    };
  }

  return {
    ...state,
    board,
    piecesOnBoard,
    piecesToPlace,
    phase,
    turn: (1 - state.turn) as MorrisPlayer,
    lastMove: { from: null, to: point, removed: null },
  };
}

export function removeMorris(state: MorrisState, point: number): MorrisState | null {
  if (state.gameOver || !state.mustRemove) return null;

  const opp = (1 - state.turn) as MorrisPlayer;
  if (state.board[point] !== opp) return null;

  const oppPieces: number[] = [];
  for (let i = 0; i < MORRIS_POINTS; i++) {
    if (state.board[i] === opp) oppPieces.push(i);
  }
  const allInMill = oppPieces.every((p) => isMill(state.board, p, opp));
  if (isMill(state.board, point, opp) && !allInMill) return null;

  const board = [...state.board];
  board[point] = null;

  const piecesOnBoard: [number, number] = [...state.piecesOnBoard] as [number, number];
  piecesOnBoard[opp]--;

  const phase = state.piecesToPlace[0] + state.piecesToPlace[1] === 0 ? 'moving' : 'placing';

  if (piecesOnBoard[opp] < 3) {
    return {
      ...state,
      board,
      piecesOnBoard,
      mustRemove: false,
      phase,
      gameOver: true,
      winner: state.turn,
      lastMove: { from: state.lastMove.from, to: state.lastMove.to, removed: point },
    };
  }

  return {
    ...state,
    board,
    piecesOnBoard,
    mustRemove: false,
    phase,
    turn: opp,
    lastMove: { from: state.lastMove.from, to: state.lastMove.to, removed: point },
  };
}

export function selectMorris(state: MorrisState, point: number): MorrisState | null {
  if (state.gameOver || state.phase === 'placing' || state.mustRemove) return null;
  if (state.board[point] !== state.turn) return null;
  return { ...state, selected: point };
}

export function moveMorris(state: MorrisState, to: number): MorrisState | null {
  if (state.gameOver || state.phase !== 'moving' || state.mustRemove) return null;
  const from = state.selected;
  if (from === null) return null;
  if (to < 0 || to >= MORRIS_POINTS || state.board[to] !== null) return null;

  const flying = state.piecesOnBoard[state.turn] === 3;
  if (!flying && !MORRIS_ADJ[from].includes(to)) return null;

  const board = [...state.board];
  board[from] = null;
  board[to] = state.turn;

  if (isMill(board, to, state.turn)) {
    return {
      ...state,
      board,
      selected: null,
      mustRemove: true,
      lastMove: { from, to, removed: null },
    };
  }

  const opp = (1 - state.turn) as MorrisPlayer;
  const oppMoves = getMorrisLegalMoves(board, opp, state.piecesOnBoard[opp]);
  if (oppMoves.length === 0) {
    return {
      ...state,
      board,
      selected: null,
      turn: opp,
      gameOver: true,
      winner: state.turn,
      lastMove: { from, to, removed: null },
    };
  }

  return {
    ...state,
    board,
    selected: null,
    turn: opp,
    lastMove: { from, to, removed: null },
  };
}

function scorePoint(board: MorrisCell[], point: number, player: MorrisPlayer, opp: MorrisPlayer): number {
  let score = 0;
  if (isMill(board, point, player)) score += 100;
  for (const mill of MORRIS_MILLS) {
    if (!mill.includes(point)) continue;
    const oppCount = mill.filter((p) => board[p] === opp).length;
    const ownCount = mill.filter((p) => board[p] === player).length;
    if (oppCount === 2 && ownCount === 0) score += 40; // blocked an opponent mill
    else if (ownCount === 2 && oppCount === 0) score += 30; // built our own threat
  }
  return score;
}

function pickRemoval(board: MorrisCell[], player: MorrisPlayer): number {
  const opp = (1 - player) as MorrisPlayer;
  const oppPieces: number[] = [];
  for (let i = 0; i < MORRIS_POINTS; i++) {
    if (board[i] === opp) oppPieces.push(i);
  }
  // Prefer pieces that are NOT part of a mill.
  const nonMill = oppPieces.filter((p) => !isMill(board, p, opp));
  const pool = nonMill.length > 0 ? nonMill : oppPieces;
  return pool[Math.floor(Math.random() * pool.length)];
}

export type MorrisAction =
  | { type: 'remove'; point: number }
  | { type: 'place'; point: number }
  | { type: 'move'; from: number; to: number };

export function getBotMorrisAction(state: MorrisState, difficulty: Difficulty): MorrisAction | null {
  const player = state.turn;
  const opp = (1 - player) as MorrisPlayer;

  if (state.mustRemove) {
    return { type: 'remove', point: pickRemoval(state.board, player) };
  }

  if (state.phase === 'placing') {
    const empty: number[] = [];
    for (let i = 0; i < MORRIS_POINTS; i++) if (state.board[i] === null) empty.push(i);
    if (empty.length === 0) return null;

    if (difficulty === 'easy') {
      return { type: 'place', point: empty[Math.floor(Math.random() * empty.length)] };
    }

    let best = empty[0];
    let bestScore = -Infinity;
    for (const p of empty) {
      const board = [...state.board];
      board[p] = player;
      const s = scorePoint(board, p, player, opp) + Math.random() * 4;
      if (s > bestScore) {
        bestScore = s;
        best = p;
      }
    }
    return { type: 'place', point: best };
  }

  // Moving phase
  const moves = getMorrisLegalMoves(state.board, player, state.piecesOnBoard[player]);
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    const m = moves[Math.floor(Math.random() * moves.length)];
    return { type: 'move', from: m.from, to: m.to };
  }

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const board = [...state.board];
    board[m.from] = null;
    board[m.to] = player;
    const s = scorePoint(board, m.to, player, opp) + Math.random() * 4;
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return { type: 'move', from: best.from, to: best.to };
}
