export type SimonColor = 'green' | 'red' | 'yellow' | 'blue';

export const SIMON_COLORS: SimonColor[] = ['green', 'red', 'yellow', 'blue'];

export const SIMON_TONES: Record<SimonColor, number> = {
  green: 261.63, // C4 (Do)
  red: 329.63,   // E4 (Mi)
  yellow: 392.0, // G4 (Sol)
  blue: 523.25,  // C5 (Do alto)
};

export interface SimonState {
  sequence: SimonColor[];
  playerInput: SimonColor[];
  isPlayingSequence: boolean;
  activeColor: SimonColor | null;
  score: number;
  highScore: number;
  gameOver: boolean;
  message: string;
}

export function createInitialSimonState(): SimonState {
  return {
    sequence: [],
    playerInput: [],
    isPlayingSequence: false,
    activeColor: null,
    score: 0,
    highScore: 0,
    gameOver: false,
    message: 'Tocca INIZIA per ascoltare la sequenza di colori!',
  };
}

export function generateNextSimonColor(): SimonColor {
  const idx = Math.floor(Math.random() * SIMON_COLORS.length);
  return SIMON_COLORS[idx];
}
