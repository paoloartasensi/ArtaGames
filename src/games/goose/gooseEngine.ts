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
 * Calculates final landing position and effects according to classic Goose rules.
 * Special tiles are resolved in chain: a goose can land on another goose, the bridge,
 * the spring or a rest tile, and a bounce back from the finish can land on one too.
 */
export function calculateGooseMove(
  currentPos: number,
  diceRoll: number
): { finalPos: number; message: string; specialType?: SpecialTile['type'] } {
  const bounce = (t: number) => (t > GOOSE_BOARD_SIZE ? GOOSE_BOARD_SIZE - (t - GOOSE_BOARD_SIZE) : t);
  const messages: string[] = [];
  let specialType: SpecialTile['type'] | undefined;

  let pos = currentPos + diceRoll;
  if (pos > GOOSE_BOARD_SIZE) {
    const overshoot = pos - GOOSE_BOARD_SIZE;
    pos = bounce(pos);
    messages.push(`Hai superato il traguardo di ${overshoot} passi: rimbalzi alla casella ${pos}!`);
  } else {
    messages.push(`Hai fatto ${diceRoll}! Avanzi alla casella ${pos}.`);
  }

  for (let guard = 0; guard < 8; guard++) {
    if (pos === GOOSE_BOARD_SIZE) {
      return { finalPos: pos, message: "🏆 VITTORIA! Sei arrivato dritto al Giardino dell'Oca!", specialType: 'finish' };
    }
    const special = SPECIAL_TILES[pos];
    if (!special) break;

    if (special.type === 'goose') {
      const from = pos;
      pos = bounce(pos + diceRoll);
      specialType = 'goose';
      messages.push(`🪿 Oca fortunata alla casella ${from}! Salti di altri ${diceRoll} passi fino alla ${pos}!`);
      continue;
    }
    if (special.type === 'bridge') {
      pos = 12;
      specialType = 'bridge';
      messages.push('🌉 Ponte Magico! Salti il fiume e atterri alla casella 12!');
      continue;
    }
    if (special.type === 'spring') {
      pos = Math.min(GOOSE_BOARD_SIZE, pos + 3);
      specialType = 'spring';
      messages.push(`🪜 Boing! Il trampolino ti spinge fino alla casella ${pos}!`);
      continue;
    }
    if (special.type === 'inn') {
      specialType = 'inn';
      messages.push('🏠 Merenda alla Locanda! Salti il prossimo turno!');
    } else if (special.type === 'well') {
      specialType = 'well';
      messages.push('🐌 Lumachina stanca! Ti fermi a riposare per il prossimo turno!');
    }
    break;
  }

  // Show only the most relevant part when a special tile was involved
  const message = specialType ? messages.slice(1).join(' ') || messages[0] : messages[0];
  return { finalPos: pos, message, specialType };
}
