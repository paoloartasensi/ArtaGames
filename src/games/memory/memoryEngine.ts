import { Difficulty } from '../../types/game';

export interface MemoryCard {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export interface MemoryState {
  cards: MemoryCard[];
  turn: 0 | 1;
  scores: [number, number];
  firstPick: number | null;
  mismatchPair: [number, number] | null; // two face-up non-matching, awaiting reset
  gameOver: boolean;
  winner: 0 | 1 | 'draw' | null;
}

export const MEMORY_EMOJIS = [
  '🐶', '🐱', '🐸', '🐵', '🦁', '🐯', '🐰', '🦊',
  '🐻', '🐼', '🐷', '🐮', '🦄', '🐢', '🐙', '🦋',
];

export function createInitialMemoryState(pairCount = 8): MemoryState {
  const chosen = [...MEMORY_EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairCount);
  const deck: MemoryCard[] = [...chosen, ...chosen].map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return {
    cards: deck,
    turn: 0,
    scores: [0, 0],
    firstPick: null,
    mismatchPair: null,
    gameOver: false,
    winner: null,
  };
}

export function flipMemoryCard(state: MemoryState, index: number): MemoryState | null {
  if (state.gameOver || state.mismatchPair) return null;
  const card = state.cards[index];
  if (!card || card.matched || card.flipped) return null;

  const cards = state.cards.map((c) => ({ ...c }));
  cards[index] = { ...card, flipped: true };

  if (state.firstPick === null) {
    return { ...state, cards, firstPick: index };
  }

  const a = state.firstPick;
  const b = index;

  if (cards[a].emoji === cards[b].emoji) {
    cards[a] = { ...cards[a], matched: true, flipped: true };
    cards[b] = { ...cards[b], matched: true, flipped: true };
    const scores: [number, number] = [...state.scores] as [number, number];
    scores[state.turn]++;
    const allMatched = cards.every((c) => c.matched);
    const winner: 0 | 1 | 'draw' | null = allMatched
      ? scores[0] > scores[1]
        ? 0
        : scores[0] < scores[1]
        ? 1
        : 'draw'
      : null;
    return { ...state, cards, scores, firstPick: null, gameOver: allMatched, winner };
  }

  return { ...state, cards, firstPick: null, mismatchPair: [a, b] };
}

export function resetMemoryMismatch(state: MemoryState): MemoryState | null {
  if (!state.mismatchPair) return null;
  const cards = state.cards.map((c) => ({ ...c }));
  const [a, b] = state.mismatchPair;
  cards[a] = { ...cards[a], flipped: false };
  cards[b] = { ...cards[b], flipped: false };
  return {
    ...state,
    cards,
    mismatchPair: null,
    turn: (1 - state.turn) as 0 | 1,
  };
}

/** The BOT observes revealed cards over time; `memory` maps index -> emoji. */
export function pickBotFirstCard(
  state: MemoryState,
  memory: Record<number, string>,
  difficulty: Difficulty
): number {
  const idx = state.cards
    .map((_, i) => i)
    .filter((i) => !state.cards[i].matched && !state.cards[i].flipped);
  if (idx.length === 0) return -1;

  const randomPick = () => idx[Math.floor(Math.random() * idx.length)];
  if (difficulty === 'easy') return randomPick();

  const unknown = idx.filter((i) => memory[i] === undefined);
  if (unknown.length > 0) return unknown[Math.floor(Math.random() * unknown.length)];
  return randomPick();
}

export function pickBotSecondCard(
  state: MemoryState,
  memory: Record<number, string>,
  first: number,
  difficulty: Difficulty
): number {
  const emoji = state.cards[first].emoji;
  const idx = state.cards
    .map((_, i) => i)
    .filter((i) => i !== first && !state.cards[i].matched && !state.cards[i].flipped);
  if (idx.length === 0) return -1;

  const knownMatch = idx.filter((i) => memory[i] === emoji);
  if (knownMatch.length > 0 && difficulty !== 'easy') return knownMatch[0];
  if (knownMatch.length > 0 && Math.random() < 0.6) return knownMatch[0];

  return idx[Math.floor(Math.random() * idx.length)];
}
