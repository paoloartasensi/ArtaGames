export interface SorobanRod {
  upper: boolean; // true = active (moved DOWN against the beam = 5)
  lower: number; // 0..4 = count of beads active (moved UP against the beam = 1 each)
}

export interface SorobanSumChallenge {
  num1: number;
  num2: number;
  target: number;
}

export type SorobanDifficulty = 'easy' | 'medium' | 'hard';

export const ROD_COUNT = 9;

// Multipliers for 9 rods from left to right
export const ROD_MULTIPLIERS = [100000000, 10000000, 1000000, 100000, 10000, 1000, 100, 10, 1];
export const ROD_LABELS = ['100M', '10M', '1M', '100k', '10k', '1k', '100', '10', '1'];
export const ROD_FULL_LABELS = [
  'Centinaia di Milioni',
  'Decine di Milioni',
  'Milioni',
  'Centinaia di Migliaia',
  'Decine di Migliaia',
  'Migliaia',
  'Centinaia',
  'Decine',
  'Unità',
];
export const RECKONING_DOT_INDICES = [2, 5, 8]; // Dots on 1M, 1k, and 1s rods

/**
 * Creates empty Soroban state (all rods at 0)
 */
export function createEmptySoroban(count = ROD_COUNT): SorobanRod[] {
  return Array.from({ length: count }, () => ({
    upper: false,
    lower: 0,
  }));
}

/**
 * Calculates numeric value of a single rod (0 to 9)
 */
export function getRodValue(rod: SorobanRod): number {
  return (rod.upper ? 5 : 0) + rod.lower;
}

/**
 * Calculates total integer number currently represented on the Soroban
 */
export function getSorobanValue(rods: SorobanRod[]): number {
  return rods.reduce((acc, rod) => acc * 10 + getRodValue(rod), 0);
}

/**
 * Converts a positive integer to the exact Soroban rods configuration
 */
export function numberToSorobanRods(num: number, rodCount = ROD_COUNT): SorobanRod[] {
  const safeNum = Math.max(0, Math.floor(num));
  const digits = safeNum.toString().padStart(rodCount, '0').slice(-rodCount).split('').map(Number);

  return digits.map((digit) => ({
    upper: digit >= 5,
    lower: digit % 5,
  }));
}

/**
 * Generates a random addition challenge based on difficulty
 */
export function generateSumChallenge(difficulty: SorobanDifficulty, prevTarget?: number): SorobanSumChallenge {
  let num1 = 0;
  let num2 = 0;
  let attempts = 0;

  do {
    attempts++;
    if (difficulty === 'easy') {
      // 5-6 year olds: sums up to 20 (single digits and friendly tens)
      const maxEasy = Math.random() > 0.4 ? 10 : 20;
      num1 = Math.floor(Math.random() * (maxEasy - 2)) + 1;
      const remaining = maxEasy - num1;
      num2 = Math.floor(Math.random() * Math.max(1, remaining)) + 1;
    } else if (difficulty === 'medium') {
      // 2-digit sums: e.g. 15 + 23 = 38, up to 99
      num1 = Math.floor(Math.random() * 50) + 10;
      num2 = Math.floor(Math.random() * 45) + 5;
    } else {
      // 3-digit sums: e.g. 135 + 242 = 377, up to 999
      num1 = Math.floor(Math.random() * 500) + 100;
      num2 = Math.floor(Math.random() * 400) + 50;
    }
  } while (num1 + num2 === prevTarget && attempts < 10);

  return {
    num1,
    num2,
    target: num1 + num2,
  };
}

/**
 * Toggles the upper bead on a rod
 */
export function toggleUpperBead(rods: SorobanRod[], rodIndex: number): SorobanRod[] {
  if (rodIndex < 0 || rodIndex >= rods.length) return rods;
  const next = [...rods];
  next[rodIndex] = {
    ...next[rodIndex],
    upper: !next[rodIndex].upper,
  };
  return next;
}

/**
 * Interacts with lower bead at index (0 = top closest to beam, 3 = bottom)
 * If bead is inactive, activates it and all beads above it (sets lower to beadIndex + 1).
 * If bead is active, deactivates it and all beads below it (sets lower to beadIndex).
 */
export function handleLowerBeadClick(rods: SorobanRod[], rodIndex: number, beadIndex: number): SorobanRod[] {
  if (rodIndex < 0 || rodIndex >= rods.length) return rods;
  const currentLower = rods[rodIndex].lower;
  let nextLower = 0;

  if (currentLower > beadIndex) {
    // Bead was active -> deactivate it and all lower ones
    nextLower = beadIndex;
  } else {
    // Bead was inactive -> activate it and all higher ones
    nextLower = beadIndex + 1;
  }

  const next = [...rods];
  next[rodIndex] = {
    ...next[rodIndex],
    lower: Math.max(0, Math.min(4, nextLower)),
  };
  return next;
}

/**
 * Explicitly sets lower beads count on a rod (0 to 4)
 */
export function setLowerBeads(rods: SorobanRod[], rodIndex: number, count: number): SorobanRod[] {
  if (rodIndex < 0 || rodIndex >= rods.length) return rods;
  const next = [...rods];
  next[rodIndex] = {
    ...next[rodIndex],
    lower: Math.max(0, Math.min(4, count)),
  };
  return next;
}
