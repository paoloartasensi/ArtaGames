import { Difficulty } from '../../types/game';

export type ReversiCell = 'black' | 'white' | null;

export interface ReversiState {
  board: ReversiCell[][];
  turn: 'black' | 'white';
  gameOver: boolean;
  winner: 'black' | 'white' | 'draw' | null;
  lastMove: { r: number; c: number } | null;
  legalMoves: { r: number; c: number }[];
}

export const REVERSI_SIZE = 8;

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export function createInitialReversiState(): ReversiState {
  const board: ReversiCell[][] = Array.from({ length: REVERSI_SIZE }, () =>
    Array(REVERSI_SIZE).fill(null)
  );
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  const turn: 'black' | 'white' = 'black';
  return {
    board,
    turn,
    gameOver: false,
    winner: null,
    lastMove: null,
    legalMoves: getLegalReversiMoves(board, turn),
  };
}

export function getLegalReversiMoves(
  board: ReversiCell[][],
  player: 'black' | 'white'
): { r: number; c: number }[] {
  const opp: 'black' | 'white' = player === 'black' ? 'white' : 'black';
  const moves: { r: number; c: number }[] = [];

  for (let r = 0; r < REVERSI_SIZE; r++) {
    for (let c = 0; c < REVERSI_SIZE; c++) {
      if (board[r][c] !== null) continue;
      let flips = 0;
      for (const [dr, dc] of DIRS) {
        let nr = r + dr;
        let nc = c + dc;
        let line = 0;
        while (nr >= 0 && nr < REVERSI_SIZE && nc >= 0 && nc < REVERSI_SIZE && board[nr][nc] === opp) {
          line++;
          nr += dr;
          nc += dc;
        }
        if (line > 0 && nr >= 0 && nr < REVERSI_SIZE && nc >= 0 && nc < REVERSI_SIZE && board[nr][nc] === player) {
          flips += line;
        }
      }
      if (flips > 0) moves.push({ r, c });
    }
  }

  return moves;
}

export function placeReversi(state: ReversiState, r: number, c: number): ReversiState | null {
  if (state.gameOver) return null;
  if (!state.legalMoves.some((m) => m.r === r && m.c === c)) return null;

  const player = state.turn;
  const opp: 'black' | 'white' = player === 'black' ? 'white' : 'black';
  const board = state.board.map((row) => [...row]);
  board[r][c] = player;

  for (const [dr, dc] of DIRS) {
    let nr = r + dr;
    let nc = c + dc;
    const toFlip: [number, number][] = [];
    while (nr >= 0 && nr < REVERSI_SIZE && nc >= 0 && nc < REVERSI_SIZE && board[nr][nc] === opp) {
      toFlip.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    if (toFlip.length > 0 && nr >= 0 && nr < REVERSI_SIZE && nc >= 0 && nc < REVERSI_SIZE && board[nr][nc] === player) {
      for (const [fr, fc] of toFlip) board[fr][fc] = player;
    }
  }

  const next: 'black' | 'white' = player === 'black' ? 'white' : 'black';
  const nextMoves = getLegalReversiMoves(board, next);
  const curMoves = getLegalReversiMoves(board, player);

  let turn: 'black' | 'white' = player;
  let gameOver = false;
  let winner: 'black' | 'white' | 'draw' | null = null;

  if (nextMoves.length > 0) {
    turn = next;
  } else if (curMoves.length > 0) {
    turn = player; // opponent must pass
  } else {
    gameOver = true;
    const { black, white } = countDiscs(board);
    winner = black > white ? 'black' : white > black ? 'white' : 'draw';
  }

  return {
    board,
    turn,
    gameOver,
    winner,
    lastMove: { r, c },
    legalMoves: gameOver ? [] : getLegalReversiMoves(board, turn),
  };
}

/** If the active player has no legal move, auto-pass (or end the game if both are stuck). */
export function autoPassReversi(state: ReversiState): ReversiState | null {
  if (state.gameOver || state.legalMoves.length > 0) return null;
  const other: 'black' | 'white' = state.turn === 'black' ? 'white' : 'black';
  const otherMoves = getLegalReversiMoves(state.board, other);
  if (otherMoves.length === 0) {
    const { black, white } = countDiscs(state.board);
    const winner = black > white ? 'black' : white > black ? 'white' : 'draw';
    return { ...state, gameOver: true, winner, legalMoves: [] };
  }
  return { ...state, turn: other, legalMoves: otherMoves };
}

function countDiscs(board: ReversiCell[][]): { black: number; white: number } {
  let black = 0;
  let white = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === 'black') black++;
      else if (cell === 'white') white++;
    }
  }
  return { black, white };
}

export function getBotReversiMove(
  state: ReversiState,
  difficulty: Difficulty
): { r: number; c: number } | null {
  const moves = state.legalMoves;
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (difficulty === 'medium') {
    let best = moves[0];
    let bestGain = -1;
    for (const m of moves) {
      const res = placeReversi(state, m.r, m.c);
      if (!res) continue;
      const before = countDiscs(state.board);
      const after = countDiscs(res.board);
      const gain = state.turn === 'black' ? after.black - before.black : after.white - before.white;
      if (gain > bestGain) {
        bestGain = gain;
        best = m;
      }
    }
    return best;
  }

  const WEIGHTS = [
    [100, -20, 10, 5, 5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10, 5, 5, 10, -20, 100],
  ];

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    let score = WEIGHTS[m.r][m.c];
    const res = placeReversi(state, m.r, m.c);
    if (res) score += res.legalMoves.length * 0.5;
    score += Math.random() * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
