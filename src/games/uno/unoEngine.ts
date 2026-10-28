export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'draw2'
  | 'skip'
  | 'reverse'
  | 'wild'
  | 'wild4';

export interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface UnoState {
  deck: UnoCard[];
  discardPile: UnoCard[];
  hands: [UnoCard[], UnoCard[]]; // Player 0 (P1), Player 1 (P2 / BOT)
  turn: 0 | 1;
  activeColor: 'red' | 'yellow' | 'green' | 'blue';
  currentColorChooser: 0 | 1 | null; // awaiting color choice if wild
  calledUno: [boolean, boolean];
  unoAlert: string | null;
  lastActionMessage: string;
  gameOver: boolean;
  winner: 0 | 1 | null;
}

const COLORS: ('red' | 'yellow' | 'green' | 'blue')[] = ['red', 'yellow', 'green', 'blue'];
const NUMBERS: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function createFullUnoDeck(): UnoCard[] {
  const cards: UnoCard[] = [];
  let idCounter = 1;

  // Number & Action cards for each of the 4 colors
  COLORS.forEach((color) => {
    // One '0' per color
    cards.push({ id: `c_${idCounter++}`, color, value: '0' });

    // Two '1' through '9' per color
    for (let i = 1; i <= 9; i++) {
      const val = String(i) as CardValue;
      cards.push({ id: `c_${idCounter++}`, color, value: val });
      cards.push({ id: `c_${idCounter++}`, color, value: val });
    }

    // Two Draw2, Skip, Reverse per color
    (['draw2', 'skip', 'reverse'] as CardValue[]).forEach((val) => {
      cards.push({ id: `c_${idCounter++}`, color, value: val });
      cards.push({ id: `c_${idCounter++}`, color, value: val });
    });
  });

  // 4 Wild and 4 Wild+4
  for (let i = 0; i < 4; i++) {
    cards.push({ id: `c_${idCounter++}`, color: 'wild', value: 'wild' });
    cards.push({ id: `c_${idCounter++}`, color: 'wild', value: 'wild4' });
  }

  // Shuffle deck thoroughly
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

export function createInitialUnoState(): UnoState {
  const fullDeck = createFullUnoDeck();

  // Deal 7 cards to each player
  const p1Hand = fullDeck.splice(0, 7);
  const p2Hand = fullDeck.splice(0, 7);

  // Find a non-wild starting card for top of discard pile
  let starterIndex = fullDeck.findIndex((c) => c.color !== 'wild');
  if (starterIndex === -1) starterIndex = 0;
  const starterCard = fullDeck.splice(starterIndex, 1)[0];

  const initialColor = starterCard.color === 'wild' ? 'red' : starterCard.color;

  return {
    deck: fullDeck,
    discardPile: [starterCard],
    hands: [p1Hand, p2Hand],
    turn: 0,
    activeColor: initialColor,
    currentColorChooser: null,
    calledUno: [false, false],
    unoAlert: null,
    lastActionMessage: 'Benvenuto a UNO! Tocca una carta valida per iniziare!',
    gameOver: false,
    winner: null,
  };
}

export function canPlayCard(card: UnoCard, topCard: UnoCard, activeColor: CardColor): boolean {
  if (card.color === 'wild') return true;
  if (card.color === activeColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

export function getTopCard(state: UnoState): UnoCard {
  return state.discardPile[state.discardPile.length - 1];
}

/**
 * Reshuffles discard pile back into deck if deck is running low
 */
export function ensureDeckHasCards(state: UnoState, neededCount = 1): UnoState {
  if (state.deck.length >= neededCount) return state;

  const top = state.discardPile[state.discardPile.length - 1];
  const oldCards = state.discardPile.slice(0, state.discardPile.length - 1);

  // Shuffle old cards
  for (let i = oldCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [oldCards[i], oldCards[j]] = [oldCards[j], oldCards[i]];
  }

  return {
    ...state,
    deck: [...state.deck, ...oldCards],
    discardPile: [top],
  };
}

/**
 * Play a card from current player's hand
 */
export function playCardAction(
  state: UnoState,
  cardId: string,
  chosenColor?: 'red' | 'yellow' | 'green' | 'blue'
): UnoState | null {
  if (state.gameOver || state.currentColorChooser !== null) return null;

  const currentPlayer = state.turn;
  const nextPlayer: 0 | 1 = currentPlayer === 0 ? 1 : 0;
  const hand = state.hands[currentPlayer];
  const cardIndex = hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return null;

  const card = hand[cardIndex];
  const topCard = getTopCard(state);

  if (!canPlayCard(card, topCard, state.activeColor)) {
    return null;
  }

  // Remove card from hand
  const newHand = [...hand];
  newHand.splice(cardIndex, 1);

  const newHands: [UnoCard[], UnoCard[]] = [...state.hands];
  newHands[currentPlayer] = newHand;

  const newDiscard = [...state.discardPile, card];

  // Check victory!
  if (newHand.length === 0) {
    return {
      ...state,
      hands: newHands,
      discardPile: newDiscard,
      gameOver: true,
      winner: currentPlayer,
      lastActionMessage: `🏆 ${currentPlayer === 0 ? 'Hai vinto la partita!' : "L'avversario ha vinto la partita!"}`,
    };
  }

  // Handle Wild cards needing color choice
  if (card.color === 'wild' && !chosenColor) {
    return {
      ...state,
      hands: newHands,
      discardPile: newDiscard,
      currentColorChooser: currentPlayer,
      lastActionMessage: 'Hai giocato una carta speciale! Scegli il nuovo colore!',
    };
  }

  let activeColor = chosenColor || (card.color as 'red' | 'yellow' | 'green' | 'blue');
  let nextTurn = nextPlayer;
  let message = '';
  let updatedDeck = [...state.deck];
  const otherHand = [...newHands[nextPlayer]];

  // Action cards effect
  if (card.value === 'draw2') {
    // Next player draws 2 and is skipped
    state = ensureDeckHasCards({ ...state, deck: updatedDeck, discardPile: newDiscard }, 2);
    updatedDeck = [...state.deck];
    const drawn = updatedDeck.splice(0, 2);
    otherHand.push(...drawn);
    newHands[nextPlayer] = otherHand;
    nextTurn = currentPlayer; // skipped, so turn returns to current
    message = `+2! ${nextPlayer === 0 ? 'Il Giocatore 1' : "L'avversario"} pesca 2 carte e salta il turno!`;
  } else if (card.value === 'skip') {
    nextTurn = currentPlayer; // in 2 players, skip gives turn back to current player
    message = `🚫 Salto turno! Tocca di nuovo a te!`;
  } else if (card.value === 'reverse') {
    nextTurn = currentPlayer; // in 2 players, reverse acts like a skip
    message = `🔁 Cambio giro! Giochi ancora tu!`;
  } else if (card.value === 'wild4') {
    // Next player draws 4 and is skipped
    state = ensureDeckHasCards({ ...state, deck: updatedDeck, discardPile: newDiscard }, 4);
    updatedDeck = [...state.deck];
    const drawn = updatedDeck.splice(0, 4);
    otherHand.push(...drawn);
    newHands[nextPlayer] = otherHand;
    nextTurn = currentPlayer; // skipped
    message = `🌈 +4! ${nextPlayer === 0 ? 'Il Giocatore 1' : "L'avversario"} pesca 4 carte e il colore diventa ${colorName(activeColor)}!`;
  } else if (card.value === 'wild') {
    message = `🌈 Colore cambiato in ${colorName(activeColor)}!`;
  } else {
    message = `${currentPlayer === 0 ? 'Hai giocato' : "L'avversario ha giocato"} ${cardName(card)}.`;
  }

  // Check UNO announcement
  const calledUno = [...state.calledUno] as [boolean, boolean];
  let unoAlert = state.unoAlert;

  if (newHand.length === 1) {
    calledUno[currentPlayer] = true;
    unoAlert = `🎉 ${currentPlayer === 0 ? 'Hai gridato' : "L'avversario grida"} UNO! Ultima carta!`;
  } else if (newHand.length > 1) {
    calledUno[currentPlayer] = false;
  }

  return {
    ...state,
    deck: updatedDeck,
    discardPile: newDiscard,
    hands: newHands,
    turn: nextTurn,
    activeColor,
    currentColorChooser: null,
    calledUno,
    unoAlert,
    lastActionMessage: message,
  };
}

/**
 * Draw 1 card from deck
 */
export function drawCardAction(state: UnoState): UnoState {
  if (state.gameOver || state.currentColorChooser !== null) return state;

  state = ensureDeckHasCards(state, 1);
  if (state.deck.length === 0) return state;

  const currentPlayer = state.turn;
  const nextPlayer: 0 | 1 = currentPlayer === 0 ? 1 : 0;
  const newDeck = [...state.deck];
  const drawnCard = newDeck.shift()!;

  const newHand = [...state.hands[currentPlayer], drawnCard];
  const newHands: [UnoCard[], UnoCard[]] = [...state.hands];
  newHands[currentPlayer] = newHand;

  // Pass turn to next player
  return {
    ...state,
    deck: newDeck,
    hands: newHands,
    turn: nextPlayer,
    lastActionMessage: `${currentPlayer === 0 ? 'Hai pescato' : "L'avversario ha pescato"} una carta.`,
  };
}

/**
 * AI Bot logic
 */
export function botPickMove(
  state: UnoState
): { cardId: string; chosenColor: 'red' | 'yellow' | 'green' | 'blue' } | null {
  const botHand = state.hands[1];
  const topCard = getTopCard(state);

  const playableCards = botHand.filter((c) => canPlayCard(c, topCard, state.activeColor));
  if (playableCards.length === 0) return null; // must draw

  // Count colors in bot hand to pick favorite color for wild
  const counts: Record<string, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
  botHand.forEach((c) => {
    if (c.color !== 'wild') counts[c.color] = (counts[c.color] || 0) + 1;
  });

  let bestColor: 'red' | 'yellow' | 'green' | 'blue' = 'red';
  let maxCount = -1;
  (Object.keys(counts) as ('red' | 'yellow' | 'green' | 'blue')[]).forEach((col) => {
    if (counts[col] > maxCount) {
      maxCount = counts[col];
      bestColor = col;
    }
  });

  // Prioritize +2 or Skip or action cards, then color match, then wild
  const actionCard = playableCards.find((c) => c.value === 'draw2' || c.value === 'skip' || c.value === 'reverse');
  if (actionCard) return { cardId: actionCard.id, chosenColor: bestColor };

  const matchingColor = playableCards.find((c) => c.color === state.activeColor);
  if (matchingColor) return { cardId: matchingColor.id, chosenColor: bestColor };

  const matchingNumber = playableCards.find((c) => c.value === topCard.value);
  if (matchingNumber) return { cardId: matchingNumber.id, chosenColor: bestColor };

  // Play wild
  const wildCard = playableCards.find((c) => c.color === 'wild');
  if (wildCard) return { cardId: wildCard.id, chosenColor: bestColor };

  return { cardId: playableCards[0].id, chosenColor: bestColor };
}

export function colorName(c: CardColor): string {
  switch (c) {
    case 'red': return 'Rosso';
    case 'yellow': return 'Giallo';
    case 'green': return 'Verde';
    case 'blue': return 'Blu';
    default: return 'Colorato';
  }
}

export function cardName(c: UnoCard): string {
  const col = colorName(c.color);
  if (c.value === 'draw2') return `+2 ${col}`;
  if (c.value === 'skip') return `Salto ${col}`;
  if (c.value === 'reverse') return `Cambio Giro ${col}`;
  if (c.value === 'wild') return 'Carta Jolly Cambio Colore';
  if (c.value === 'wild4') return 'Carta Jolly +4';
  return `${c.value} ${col}`;
}
