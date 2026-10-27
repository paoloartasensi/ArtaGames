export interface SpecialTile {
  index: number;
  type: 'goose' | 'bridge' | 'spring' | 'inn' | 'well' | 'finish';
  title: string;
  emoji: string;
  description: string;
  color: string;
}

export const GOOSE_BOARD_SIZE = 30; // 0 to 30

export const SPECIAL_TILES: Record<number, SpecialTile> = {
  5: {
    index: 5,
    type: 'goose',
    title: 'Oca Fortunata',
    emoji: '🪿',
    description: 'Oca ochetta, salta alla prossima casetta! Avanzi ancora del valore del dado!',
    color: '#34d399',
  },
  6: {
    index: 6,
    type: 'bridge',
    title: 'Il Ponte Magico',
    emoji: '🌉',
    description: 'Attraversa il grande fiume! Vola direttamente alla casella 12!',
    color: '#60a5fa',
  },
  9: {
    index: 9,
    type: 'goose',
    title: 'Oca Fortunata',
    emoji: '🪿',
    description: 'Oca ochetta, salta alla prossima casetta! Avanzi ancora del valore del dado!',
    color: '#34d399',
  },
  14: {
    index: 14,
    type: 'goose',
    title: 'Oca Fortunata',
    emoji: '🪿',
    description: 'Oca ochetta, salta alla prossima casetta! Avanzi ancora del valore del dado!',
    color: '#34d399',
  },
  16: {
    index: 16,
    type: 'spring',
    title: 'Super Trampolino',
    emoji: '🪜',
    description: 'Boing! Fai un super balzo in avanti di +3 caselle!',
    color: '#fbbf24',
  },
  18: {
    index: 18,
    type: 'goose',
    title: 'Oca Fortunata',
    emoji: '🪿',
    description: 'Oca ochetta, salta alla prossima casetta! Avanzi ancora del valore del dado!',
    color: '#34d399',
  },
  19: {
    index: 19,
    type: 'inn',
    title: 'La Locanda della Merenda',
    emoji: '🏠',
    description: 'Gnam gnam! Ti fermi a gustare una golosa merenda per 1 turno!',
    color: '#f87171',
  },
  23: {
    index: 23,
    type: 'goose',
    title: 'Oca Fortunata',
    emoji: '🪿',
    description: 'Oca ochetta, salta alla prossima casetta! Avanzi ancora del valore del dado!',
    color: '#34d399',
  },
  24: {
    index: 24,
    type: 'well',
    title: 'Il Pozzo della Lumachina',
    emoji: '🐌',
    description: 'La simpatica lumachina è stanca: ti riposi per 1 turno!',
    color: '#fb923c',
  },
  27: {
    index: 27,
    type: 'goose',
    title: 'Oca Fortunata',
    emoji: '🪿',
    description: 'Oca ochetta, salta alla prossima casetta! Avanzi ancora del valore del dado!',
    color: '#34d399',
  },
  30: {
    index: 30,
    type: 'finish',
    title: "Il Giardino dell'Oca",
    emoji: '🏆',
    description: 'Hai raggiunto il Giardino dorato! Evviva, hai vinto la coppa!',
    color: '#facc15',
  },
};

export interface GooseState {
  positions: [number, number]; // tile index 0..30
  skipTurns: [number, number]; // counter for skipped turns
  turn: 0 | 1;
  lastDice: number | null;
  history: string[];
  gameOver: boolean;
  winner: 0 | 1 | null;
  lastSpecialMessage: string | null;
}

export function createInitialGooseState(): GooseState {
  return {
    positions: [0, 0],
    skipTurns: [0, 0],
    turn: 0,
    lastDice: null,
    history: [],
    gameOver: false,
    winner: null,
    lastSpecialMessage: 'Tocca il grande Dado per iniziare la tua corsa nel prato!',
  };
}

export interface MoveStep {
  intermediatePos: number;
  message?: string;
  isSpecial?: boolean;
}

/**
 * Calculates final landing position and effects according to classic Goose rules
 */
export function calculateGooseMove(
  currentPos: number,
  diceRoll: number
): { finalPos: number; message: string; specialType?: SpecialTile['type'] } {
  let target = currentPos + diceRoll;

  // Exact arrival rule: if overshooting 30, bounce backwards
  if (target > GOOSE_BOARD_SIZE) {
    const overshoot = target - GOOSE_BOARD_SIZE;
    target = GOOSE_BOARD_SIZE - overshoot;
    const msg = `Hai superato il traguardo di ${overshoot} passi: rimbalzi alla casella ${target}!`;
    return { finalPos: target, message: msg };
  }

  // Exact victory!
  if (target === GOOSE_BOARD_SIZE) {
    return {
      finalPos: 30,
      message: "🏆 VITTORIA! Sei arrivato dritto al Giardino dell'Oca!",
      specialType: 'finish',
    };
  }

  // Check special tiles
  const special = SPECIAL_TILES[target];
  if (!special) {
    return {
      finalPos: target,
      message: `Hai fatto ${diceRoll}! Avanzi alla casella ${target}.`,
    };
  }

  if (special.type === 'goose') {
    // Goose tile: forward again by the same dice roll!
    let nextTarget = target + diceRoll;
    if (nextTarget > GOOSE_BOARD_SIZE) {
      const overshoot = nextTarget - GOOSE_BOARD_SIZE;
      nextTarget = GOOSE_BOARD_SIZE - overshoot;
    }
    return {
      finalPos: nextTarget,
      message: `🪿 Oca fortunata alla casella ${target}! Fai un salto doppio di altri ${diceRoll} passi fino alla ${nextTarget}!`,
      specialType: 'goose',
    };
  }

  if (special.type === 'bridge') {
    return {
      finalPos: 12,
      message: '🌉 Sei sul Ponte Magico alla casella 6! Salti il fiume e atterri alla casella 12!',
      specialType: 'bridge',
    };
  }

  if (special.type === 'spring') {
    return {
      finalPos: Math.min(GOOSE_BOARD_SIZE, target + 3),
      message: '🪜 Boing! Il trampolino ti spinge avanti di altre 3 caselle!',
      specialType: 'spring',
    };
  }

  if (special.type === 'inn') {
    return {
      finalPos: target,
      message: '🏠 Merenda alla Locanda! Mangi una torta e salti il prossimo turno!',
      specialType: 'inn',
    };
  }

  if (special.type === 'well') {
    return {
      finalPos: target,
      message: '🐌 Lumachina stanca! Ti fermi a riposare per il prossimo turno!',
      specialType: 'well',
    };
  }

  return {
    finalPos: target,
    message: `Avanzi alla casella ${target}.`,
  };
}
