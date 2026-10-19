import { Difficulty } from '../../types/game';

export interface MancalaState {
  // 0-5 = P1 pits (bottom), 6 = P1 store, 7-12 = P2 pits (top), 13 = P2 store
  pits: number[];
  turn: 0 | 1;
  gameOver: boolean;
  winner: 0 | 1 | 'draw' | null;
  lastSow: { player: 0 | 1; pit: number; finalPit: number; captured: boolean } | null;
}

const P1_PITS = [0, 1, 2, 3, 4, 5];
const P2_PITS = [7, 8, 9, 10, 11, 12];

// Counter-clockwise order of play around the board.
const NEXT = [1, 2, 3, 4, 5, 6, 12, 11, 10, 9, 8, 7, 13, 0];

export function createInitialMancalaState(): MancalaState {
  const pits = new Array(14).fill(0).map((_, i) => (i === 6 || i === 13 ? 0 : 4));
  return {
    pits,
    turn: 0,
    gameOver: false,
    winner: null,
    lastSow: null,
  };
}

export function sowMancala(state: MancalaState, pit: number): MancalaState | null {
  if (state.gameOver) return null;

  const turn = state.turn;
  const ownPits = turn === 0 ? P1_PITS : P2_PITS;
  const ownStore = turn === 0 ? 6 : 13;
  const oppStore = turn === 0 ? 13 : 6;

  if (!ownPits.includes(pit) || state.pits[pit] === 0) return null;

  const pits = [...state.pits];
  let stones = pits[pit];
  pits[pit] = 0;

  let i = pit;
  while (stones > 0) {
    i = NEXT[i];
    if (i === oppStore) continue;
    pits[i]++;
    stones--;
  }

  const extraTurn = i === ownStore;
  let captured = false;

  if (!extraTurn && ownPits.includes(i) && pits[i] === 1) {
    const opposite = 12 - i;
    if (pits[opposite] > 0) {
      pits[ownStore] += pits[i] + pits[opposite];
      pits[i] = 0;
      pits[opposite] = 0;
      captured = true;
    }
  }

  let gameOver = false;
  let winner: 0 | 1 | 'draw' | null = null;
  const p1empty = P1_PITS.every((p) => pits[p] === 0);
  const p2empty = P2_PITS.every((p) => pits[p] === 0);

  if (p1empty || p2empty) {
    for (const p of P1_PITS) {
      pits[6] += pits[p];
      pits[p] = 0;
    }
    for (const p of P2_PITS) {
      pits[13] += pits[p];
      pits[p] = 0;
    }
    gameOver = true;
    winner = pits[6] > pits[13] ? 0 : pits[6] < pits[13] ? 1 : 'draw';
  }

  return {
    ...state,
    pits,
    turn: extraTurn ? turn : ((1 - turn) as 0 | 1),
    gameOver,
    winner,
    lastSow: { player: turn, pit, finalPit: i, captured },
  };
}

export function getBotMancalaMove(state: MancalaState, difficulty: Difficulty): number {
  const turn = state.turn;
  const ownPits = turn === 0 ? P1_PITS : P2_PITS;
  const valid = ownPits.filter((p) => state.pits[p] > 0);
  if (valid.length === 0) return -1;

  if (difficulty === 'easy') {
    return valid[Math.floor(Math.random() * valid.length)];
  }

  const ownStore = turn === 0 ? 6 : 13;
  const oppStore = turn === 0 ? 13 : 6;

  let best = valid[0];
  let bestScore = -Infinity;

  for (const p of valid) {
    const res = sowMancala(state, p);
    if (!res) continue;

    let score = res.pits[ownStore] - res.pits[oppStore];
    if (res.lastSow && res.lastSow.finalPit === ownStore) score += 8; // extra turn
    if (res.lastSow && res.lastSow.captured) score += 6; // captured stones
    score += Math.random() * (difficulty === 'master' ? 0.5 : 2);

    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return best;
}
