import { Difficulty } from '../../types/game';

export interface MastermindConfig {
  length: number; // pegs in the secret code
  colors: number; // how many colours are in play
  tries: number;
  repeats: boolean; // may the code repeat a colour?
}

export const MASTERMIND_CONFIGS: Record<Difficulty, MastermindConfig> = {
  easy: { length: 3, colors: 4, tries: 8, repeats: false },
  medium: { length: 4, colors: 5, tries: 10, repeats: false },
  hard: { length: 4, colors: 6, tries: 10, repeats: true },
  master: { length: 4, colors: 6, tries: 8, repeats: true },
};

export const PEG_COLORS = [
  { name: 'Rosso', hex: '#ef4444' },
  { name: 'Blu', hex: '#3b82f6' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Giallo', hex: '#facc15' },
  { name: 'Viola', hex: '#a855f7' },
  { name: 'Arancione', hex: '#f97316' },
];

export function createSecret(cfg: MastermindConfig): number[] {
  const pool = Array.from({ length: cfg.colors }, (_, i) => i);
  const secret: number[] = [];
  while (secret.length < cfg.length) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!cfg.repeats && secret.includes(pick)) continue;
    secret.push(pick);
  }
  return secret;
}

/** exact = right colour in the right place; near = right colour in the wrong place. */
export function scoreGuess(guess: number[], secret: number[]): { exact: number; near: number } {
  let exact = 0;
  const restSecret: Record<number, number> = {};
  const restGuess: Record<number, number> = {};
  guess.forEach((g, i) => {
    if (g === secret[i]) exact++;
    else {
      restSecret[secret[i]] = (restSecret[secret[i]] || 0) + 1;
      restGuess[g] = (restGuess[g] || 0) + 1;
    }
  });
  let near = 0;
  Object.keys(restGuess).forEach((k) => {
    const key = Number(k);
    near += Math.min(restGuess[key], restSecret[key] || 0);
  });
  return { exact, near };
}
