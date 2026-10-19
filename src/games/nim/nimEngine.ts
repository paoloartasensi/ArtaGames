import { Difficulty } from '../../types/game';

export type NimPlayer = 0 | 1;

export const NIM_START = 16;
export const NIM_MAX_TAKE = 3;

export interface NimState {
  sticks: number;
  turn: NimPlayer;
  gameOver: boolean;
  winner: NimPlayer | null;
  lastTake: number;
}

export function createInitialNimState(): NimState {
  return { sticks: NIM_START, turn: 0, gameOver: false, winner: null, lastTake: 0 };
}

// Misère Nim: whoever is forced to take the last stick loses.
export function takeNimSticks(state: NimState, n: number): NimState | null {
  if (state.gameOver || n < 1 || n > NIM_MAX_TAKE || n > state.sticks) return null;

  const sticks = state.sticks - n;
  if (sticks === 0) {
    return {
      sticks: 0,
      turn: state.turn,
      gameOver: true,
      winner: (1 - state.turn) as NimPlayer, // the taker loses
      lastTake: n,
    };
  }

  return {
    sticks,
    turn: (1 - state.turn) as NimPlayer,
    gameOver: false,
    winner: null,
    lastTake: n,
  };
}

export function getBotNimTake(state: NimState, difficulty: Difficulty): number {
  const n = state.sticks;
  const max = Math.min(NIM_MAX_TAKE, n);

  // Optimal play: leave the opponent a losing position (sticks ≡ 1 mod 4).
  let optTake = -1;
  for (let k = 1; k <= max; k++) {
    if ((n - k) % 4 === 1) {
      optTake = k;
      break;
    }
  }

  const randomTake = () => 1 + Math.floor(Math.random() * max);

  if (optTake === -1) return randomTake(); // already losing: any move

  switch (difficulty) {
    case 'easy':
      return randomTake();
    case 'medium':
      return Math.random() < 0.6 ? optTake : randomTake();
    case 'hard':
      return Math.random() < 0.85 ? optTake : randomTake();
    case 'master':
      return optTake;
  }
}
