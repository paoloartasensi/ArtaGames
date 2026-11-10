export interface SorobanRod {
  upper: boolean; // true = active (moved DOWN against the beam = 5)
  lower: number; // 0..4 = count of beads active (moved UP against the beam = 1 each)
}

export type SorobanOpType = '+' | '-' | '×';

export interface SorobanChallenge {
  num1: number;
  num2: number;
  op: SorobanOpType;
  target: number;
}

// Backwards-compatible alias
export type SorobanSumChallenge = SorobanChallenge;

export interface AnzanSequenceStep {
  value: number; // e.g. 3, 5, -2, 1
  display: string; // e.g. "+3", "+5", "-2", "+1"
}

export interface AnzanChallenge {
  steps: AnzanSequenceStep[];
  target: number;
}

export type SorobanDifficulty = 'easy' | 'medium' | 'hard';
export type SorobanMode = 'challenge' | 'anzan' | 'free' | 'school';

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
 * Generates an arithmetic challenge (+, -, ×, or mixed) based on difficulty
 */
export function generateSorobanChallenge(
  op: '+' | '-' | '×' | 'mixed',
  difficulty: SorobanDifficulty,
  prevTarget?: number
): SorobanChallenge {
  const actualOp: SorobanOpType = op === 'mixed'
    ? (['+', '-', '×'][Math.floor(Math.random() * 3)] as SorobanOpType)
    : op;

  let num1 = 0;
  let num2 = 0;
  let target = 0;
  let attempts = 0;

  do {
    attempts++;

    if (actualOp === '+') {
      if (difficulty === 'easy') {
        const maxEasy = Math.random() > 0.4 ? 10 : 20;
        num1 = Math.floor(Math.random() * (maxEasy - 2)) + 1;
        const remaining = maxEasy - num1;
        num2 = Math.floor(Math.random() * Math.max(1, remaining)) + 1;
      } else if (difficulty === 'medium') {
        num1 = Math.floor(Math.random() * 50) + 10;
        num2 = Math.floor(Math.random() * 45) + 5;
      } else {
        num1 = Math.floor(Math.random() * 500) + 100;
        num2 = Math.floor(Math.random() * 400) + 50;
      }
      target = num1 + num2;
    } else if (actualOp === '-') {
      // Subtractions always positive for children & soroban learning
      if (difficulty === 'easy') {
        num1 = Math.floor(Math.random() * 15) + 4; // 4..18
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      } else if (difficulty === 'medium') {
        num1 = Math.floor(Math.random() * 70) + 25; // 25..94
        num2 = Math.floor(Math.random() * (num1 - 10)) + 5;
      } else {
        num1 = Math.floor(Math.random() * 700) + 200;
        num2 = Math.floor(Math.random() * (num1 - 50)) + 20;
      }
      target = num1 - num2;
    } else {
      // Multiplication
      if (difficulty === 'easy') {
        num1 = Math.floor(Math.random() * 8) + 2; // 2..9
        num2 = Math.floor(Math.random() * 8) + 2; // 2..9
      } else if (difficulty === 'medium') {
        num1 = Math.floor(Math.random() * 18) + 11; // 11..28
        num2 = Math.floor(Math.random() * 7) + 2; // 2..8
      } else {
        num1 = Math.floor(Math.random() * 40) + 20; // 20..59
        num2 = Math.floor(Math.random() * 15) + 6; // 6..20
      }
      target = num1 * num2;
    }
  } while (target === prevTarget && attempts < 10);

  return {
    num1,
    num2,
    op: actualOp,
    target,
  };
}

/**
 * Generates an Anzan flash sequence of operations
 * e.g. 3 to 6 numbers flashing one by one: "+4", "+5", "-2", "+1" -> target = 8
 */
export function generateAnzanSequence(difficulty: SorobanDifficulty): AnzanChallenge {
  const count = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
  const steps: AnzanSequenceStep[] = [];
  let currentTotal = 0;

  for (let i = 0; i < count; i++) {
    let val = 0;
    if (i === 0) {
      // First number is always positive
      val = difficulty === 'easy'
        ? Math.floor(Math.random() * 8) + 1 // 1..8
        : difficulty === 'medium'
        ? Math.floor(Math.random() * 20) + 5
        : Math.floor(Math.random() * 50) + 15;
    } else {
      // Subsequent numbers can be positive or negative, but total must stay > 0 and reasonable
      const canSubtract = currentTotal > (difficulty === 'easy' ? 4 : 10);
      const isSub = canSubtract && Math.random() > 0.45;

      if (isSub) {
        const maxSub = Math.min(currentTotal - 1, difficulty === 'easy' ? 5 : 20);
        val = -(Math.floor(Math.random() * Math.max(1, maxSub)) + 1);
      } else {
        const maxAdd = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 18 : 35;
        val = Math.floor(Math.random() * maxAdd) + 1;
      }
    }

    currentTotal += val;
    steps.push({
      value: val,
      display: val > 0 && i > 0 ? `+${val}` : `${val}`,
    });
  }

  return {
    steps,
    target: currentTotal,
  };
}

// Backwards-compatible alias
export function generateSumChallenge(difficulty: SorobanDifficulty, prevTarget?: number): SorobanChallenge {
  return generateSorobanChallenge('+', difficulty, prevTarget);
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
