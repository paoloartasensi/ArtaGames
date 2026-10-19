import { Difficulty } from '../../types/game';

export interface DominoTile {
  id: number;
  a: number;
  b: number;
}

export interface DominoState {
  hands: [DominoTile[], DominoTile[]]; // 0 = P1, 1 = P2 / BOT
  board: { tile: DominoTile; flip: boolean }[];
  leftEnd: number;
  rightEnd: number;
  boneyard: DominoTile[];
  turn: 0 | 1;
  gameOver: boolean;
  winner: 0 | 1 | 'draw' | null;
  lastMove: { player: 0 | 1; tileId: number; side: 'left' | 'right'; passed: boolean } | null;
}

export function createAllDominoTiles(): DominoTile[] {
  const tiles: DominoTile[] = [];
  let id = 0;
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      tiles.push({ id: id++, a, b });
    }
  }
  return tiles;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialDominoState(): DominoState {
  const tiles = shuffle(createAllDominoTiles());
  const handSize = 6;
  const h1 = tiles.slice(0, handSize);
  const h2 = tiles.slice(handSize, handSize * 2);
  const boneyard = tiles.slice(handSize * 2);

  // P1 leads with their first tile.
  const starter = h1[0];
  return {
    hands: [h1.slice(1), h2],
    board: [{ tile: starter, flip: false }],
    leftEnd: starter.a,
    rightEnd: starter.b,
    boneyard,
    turn: 1,
    gameOver: false,
    winner: null,
    lastMove: null,
  };
}

export function tileMatches(
  tile: DominoTile,
  left: number,
  right: number
): 'left' | 'right' | 'both' | null {
  const l = tile.a === left || tile.b === left;
  const r = tile.a === right || tile.b === right;
  if (l && r) return 'both';
  if (l) return 'left';
  if (r) return 'right';
  return null;
}

export function hasPlayableTile(hand: DominoTile[], left: number, right: number): boolean {
  return hand.some((t) => tileMatches(t, left, right) !== null);
}

export function playDomino(
  state: DominoState,
  tileId: number,
  side?: 'left' | 'right'
): DominoState | null {
  if (state.gameOver) return null;

  const player = state.turn;
  const hand = state.hands[player];
  const idx = hand.findIndex((t) => t.id === tileId);
  if (idx < 0) return null;

  const tile = hand[idx];
  const match = tileMatches(tile, state.leftEnd, state.rightEnd);
  if (!match) return null;

  const chosen: 'left' | 'right' =
    side && (match === 'both' || match === side) ? side : match === 'both' ? 'right' : match;

  let flip: boolean;
  let newLeft = state.leftEnd;
  let newRight = state.rightEnd;

  if (chosen === 'left') {
    if (tile.b === state.leftEnd) {
      flip = false;
      newLeft = tile.a;
    } else {
      flip = true;
      newLeft = tile.b;
    }
  } else {
    if (tile.a === state.rightEnd) {
      flip = false;
      newRight = tile.b;
    } else {
      flip = true;
      newRight = tile.a;
    }
  }

  const newHand = hand.filter((t) => t.id !== tileId);
  const hands: [DominoTile[], DominoTile[]] = [...state.hands] as [DominoTile[], DominoTile[]];
  hands[player] = newHand;

  const entry = { tile, flip };
  const board = chosen === 'left' ? [entry, ...state.board] : [...state.board, entry];

  const won = newHand.length === 0;

  return {
    ...state,
    hands,
    board,
    leftEnd: newLeft,
    rightEnd: newRight,
    turn: won ? player : ((1 - player) as 0 | 1),
    gameOver: won,
    winner: won ? player : null,
    lastMove: { player, tileId, side: chosen, passed: false },
  };
}

function passDomino(state: DominoState, player: 0 | 1): DominoState {
  const next = (1 - player) as 0 | 1;
  const otherPlayable = hasPlayableTile(state.hands[next], state.leftEnd, state.rightEnd);

  if (!otherPlayable && state.boneyard.length === 0) {
    const pips = (hand: DominoTile[]) => hand.reduce((s, t) => s + t.a + t.b, 0);
    const p0 = pips(state.hands[0]);
    const p1 = pips(state.hands[1]);
    const winner: 0 | 1 | 'draw' = p0 < p1 ? 0 : p1 < p0 ? 1 : 'draw';
    return {
      ...state,
      turn: next,
      gameOver: true,
      winner,
      lastMove: { player, tileId: -1, side: 'right', passed: true },
    };
  }

  return {
    ...state,
    turn: next,
    lastMove: { player, tileId: -1, side: 'right', passed: true },
  };
}

export function drawDomino(state: DominoState): DominoState | null {
  if (state.gameOver) return null;

  const player = state.turn;

  if (state.boneyard.length > 0) {
    const boneyard = [...state.boneyard];
    const drawn = boneyard.pop()!;
    const hands: [DominoTile[], DominoTile[]] = [...state.hands] as [DominoTile[], DominoTile[]];
    hands[player] = [...hands[player], drawn];

    const playable = hasPlayableTile(hands[player], state.leftEnd, state.rightEnd);
    if (playable) {
      return {
        ...state,
        hands,
        boneyard,
        lastMove: { player, tileId: drawn.id, side: 'right', passed: false },
      };
    }
    return passDomino({ ...state, hands, boneyard }, player);
  }

  return passDomino(state, player);
}

export function getBotDominoAction(
  state: DominoState,
  difficulty: Difficulty
): { type: 'play'; tileId: number; side: 'left' | 'right' } | { type: 'draw' } {
  const hand = state.hands[state.turn];
  const playable = hand.filter((t) => tileMatches(t, state.leftEnd, state.rightEnd) !== null);

  if (playable.length === 0) return { type: 'draw' };

  let chosenTile = playable[0];

  if (difficulty !== 'easy') {
    let bestScore = -Infinity;
    for (const t of playable) {
      let s = 0;
      if (t.a === t.b) s += 3; // doubles keep options open
      s += (t.a + t.b) * 0.5; // shed high pips early
      s += Math.random() * (difficulty === 'master' ? 0.3 : 1);
      if (s > bestScore) {
        bestScore = s;
        chosenTile = t;
      }
    }
  } else {
    chosenTile = playable[Math.floor(Math.random() * playable.length)];
  }

  const m = tileMatches(chosenTile, state.leftEnd, state.rightEnd)!;
  return { type: 'play', tileId: chosenTile.id, side: m === 'both' ? 'right' : m };
}
