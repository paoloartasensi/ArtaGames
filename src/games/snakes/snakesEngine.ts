import { Difficulty } from '../../types/game';

export type SnakesPlayer = 0 | 1;

export interface SnakesState {
  positions: [number, number]; // 1..100
  turn: SnakesPlayer;
  dice: number | null;
  gameOver: boolean;
  winner: SnakesPlayer | null;
  lastMove: { player: SnakesPlayer; from: number; to: number; dice: number } | null;
}

export const BOARD_SIZE = 100;

// Classic snakes & ladders board: ladders climb up, snakes slide down.
export const SNAKES_AND_LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};

export function isLadder(from: number): boolean {
  const to = SNAKES_AND_LADDERS[from];
  return to !== undefined && to > from;
}

export function isSnake(from: number): boolean {
  const to = SNAKES_AND_LADDERS[from];
  return to !== undefined && to < from;
}

export function createInitialSnakesState(): SnakesState {
  return {
    positions: [1, 1],
    turn: 0,
    dice: null,
    gameOver: false,
    winner: null,
    lastMove: null,
  };
}

function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6);
}

/**
 * Rolls the die and advances the current player. Landing exactly on 100 wins;
 * overshooting keeps the piece in place (must land exactly).
 */
export function rollSnakesMove(state: SnakesState): SnakesState | null {
  if (state.gameOver) return null;

  const player = state.turn;
  const dice = rollDie();
  const from = state.positions[player];
  let to = from + dice;

  if (to > BOARD_SIZE) {
    to = from;
  } else {
    const target = SNAKES_AND_LADDERS[to];
    if (target !== undefined) to = target;
  }

  const positions: [number, number] = [...state.positions] as [number, number];
  positions[player] = to;

  const gameOver = to === BOARD_SIZE;

  return {
    positions,
    turn: gameOver ? player : ((1 - player) as SnakesPlayer),
    dice,
    gameOver,
    winner: gameOver ? player : null,
    lastMove: { player, from, to, dice },
  };
}

// Snakes & ladders has no decision to make: the BOT simply rolls the die too.
export function getBotSnakesMove(_state: SnakesState, _difficulty: Difficulty): 'roll' {
  return 'roll';
}

/**
 * Maps a board number (1..100) to a { row, col } in a 10x10 serpentine grid
 * where cell 1 is bottom-left and cell 100 is top-left.
 */
export function cellRowCol(n: number): { row: number; col: number } {
  const i = n - 1; // 0..99
  const bottomRow = Math.floor(i / 10); // 0 = bottom row
  const withinRow = i % 10;
  const row = 9 - bottomRow; // 0 = top row on screen
  const col = bottomRow % 2 === 0 ? withinRow : 9 - withinRow;
  return { row, col };
}
