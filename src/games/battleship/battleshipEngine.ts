import { Difficulty } from '../../types/game';

export interface ShipDef {
  id: string;
  name: string;
  size: number;
  icon: string;
}

export const FLEET_CONFIG: ShipDef[] = [
  { id: 'carrier', name: 'Portaerei', size: 4, icon: '🚢' },
  { id: 'cruiser', name: 'Incrociatore', size: 3, icon: '🛳️' },
  { id: 'submarine', name: 'Sottomarino', size: 3, icon: '⚓' },
  { id: 'destroyer', name: 'Cacciatorpediniere', size: 2, icon: '🚤' },
  { id: 'patrol', name: 'Motovedetta', size: 2, icon: '⛵' },
];

export interface PlacedShip {
  id: string;
  name: string;
  size: number;
  r: number;
  c: number;
  horizontal: boolean;
  hits: number;
  sunk: boolean;
}

export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export type Side = 'p1' | 'p2';

export interface BattleshipState {
  gridSize: number;
  // Two symmetric sides. Each board is that side's own territory:
  // their ships plus the hits/misses the opponent has landed on them.
  p1Ships: PlacedShip[];
  p2Ships: PlacedShip[];
  p1Board: CellState[][];
  p2Board: CellState[][];
  turn: Side;
  phase: 'placement' | 'battle' | 'game_over';
  winner: Side | null;
  lastMessage: string;
  // Bot AI targeting memory (only meaningful in bot mode)
  botHits: { r: number; c: number }[];
}

export function createEmptyBoard(gridSize: number): CellState[][] {
  return Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill('empty' as CellState));
}

export function fleetToBoard(ships: PlacedShip[], gridSize: number): CellState[][] {
  const board = createEmptyBoard(gridSize);
  ships.forEach((ship) => {
    for (let i = 0; i < ship.size; i++) {
      const r = ship.horizontal ? ship.r : ship.r + i;
      const c = ship.horizontal ? ship.c + i : ship.c;
      board[r][c] = 'ship';
    }
  });
  return board;
}

export function generateRandomFleet(gridSize: number, defs: ShipDef[]): PlacedShip[] {
  const placed: PlacedShip[] = [];
  const occupied = new Set<string>();

  for (const def of defs) {
    let placedSuccess = false;
    let attempts = 0;

    while (!placedSuccess && attempts < 200) {
      attempts++;
      const horizontal = Math.random() > 0.5;
      const maxR = horizontal ? gridSize : gridSize - def.size;
      const maxC = horizontal ? gridSize - def.size : gridSize;

      const r = Math.floor(Math.random() * maxR);
      const c = Math.floor(Math.random() * maxC);

      // Check collision + 1 cell buffer for clear view
      let collision = false;
      for (let i = 0; i < def.size; i++) {
        const checkR = horizontal ? r : r + i;
        const checkC = horizontal ? c + i : c;
        if (occupied.has(`${checkR},${checkC}`)) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        for (let i = 0; i < def.size; i++) {
          const occR = horizontal ? r : r + i;
          const occC = horizontal ? c + i : c;
          occupied.add(`${occR},${occC}`);
        }

        placed.push({
          id: def.id,
          name: def.name,
          size: def.size,
          r,
          c,
          horizontal,
          hits: 0,
          sunk: false,
        });
        placedSuccess = true;
      }
    }
  }

  return placed;
}

export function createInitialBattleshipState(
  gridSize: number = 8,
  phase: 'placement' | 'battle' = 'battle',
): BattleshipState {
  const p1Ships = generateRandomFleet(gridSize, FLEET_CONFIG);
  const p2Ships = generateRandomFleet(gridSize, FLEET_CONFIG);

  return {
    gridSize,
    p1Ships,
    p2Ships,
    p1Board: fleetToBoard(p1Ships, gridSize),
    p2Board: fleetToBoard(p2Ships, gridSize),
    turn: 'p1',
    phase,
    winner: null,
    lastMessage:
      phase === 'placement'
        ? 'Giocatore 1: disponi le tue navi, poi premi Pronto!'
        : 'Tocca una casella sulla griglia radar per sparare!',
    botHits: [],
  };
}

export function randomizeFleet(state: BattleshipState, side: Side): BattleshipState {
  const newFleet = generateRandomFleet(state.gridSize, FLEET_CONFIG);
  const newBoard = fleetToBoard(newFleet, state.gridSize);

  if (side === 'p1') {
    return { ...state, p1Ships: newFleet, p1Board: newBoard };
  }
  return { ...state, p2Ships: newFleet, p2Board: newBoard };
}

export function fireShot(
  state: BattleshipState,
  attacker: Side,
  r: number,
  c: number,
): {
  nextState: BattleshipState;
  result: 'hit' | 'miss' | 'sunk';
  sunkShipName?: string;
} | null {
  if (state.phase !== 'battle' || state.turn !== attacker) return null;

  const defender: Side = attacker === 'p1' ? 'p2' : 'p1';
  const defenderBoard = defender === 'p1' ? state.p1Board : state.p2Board;
  const defenderShips = defender === 'p1' ? state.p1Ships : state.p2Ships;

  if (defenderBoard[r][c] === 'hit' || defenderBoard[r][c] === 'miss') return null;

  const newBoard = defenderBoard.map((row) => [...row]);
  const newShips = defenderShips.map((s) => ({ ...s }));

  let hitShip: PlacedShip | null = null;
  for (const ship of newShips) {
    for (let i = 0; i < ship.size; i++) {
      const shipR = ship.horizontal ? ship.r : ship.r + i;
      const shipC = ship.horizontal ? ship.c + i : ship.c;
      if (shipR === r && shipC === c) {
        hitShip = ship;
        break;
      }
    }
    if (hitShip) break;
  }

  let result: 'hit' | 'miss' | 'sunk' = 'miss';
  let sunkShipName: string | undefined;

  if (hitShip) {
    newBoard[r][c] = 'hit';
    hitShip.hits += 1;
    if (hitShip.hits >= hitShip.size) {
      hitShip.sunk = true;
      result = 'sunk';
      sunkShipName = hitShip.name;
    } else {
      result = 'hit';
    }
  } else {
    newBoard[r][c] = 'miss';
  }

  const allSunk = newShips.every((s) => s.sunk);
  const winner: Side | null = allSunk ? attacker : null;

  let msg = "Acqua! Colpo mancato.";
  if (result === 'sunk') msg = `BOOM! Nave affondata: ${sunkShipName}!`;
  else if (result === 'hit') msg = 'COLPITO! Una nave è stata centrata!';

  const nextState: BattleshipState = {
    ...state,
    turn: allSunk ? attacker : defender,
    phase: allSunk ? 'game_over' : 'battle',
    winner,
    lastMessage: msg,
  };

  if (defender === 'p1') {
    nextState.p1Board = newBoard;
    nextState.p1Ships = newShips;
  } else {
    nextState.p2Board = newBoard;
    nextState.p2Ships = newShips;
  }

  return { nextState, result, sunkShipName };
}

export function fireBotShot(
  state: BattleshipState,
  difficulty: Difficulty,
): {
  nextState: BattleshipState;
  result: 'hit' | 'miss' | 'sunk';
  target: { r: number; c: number };
} {
  const size = state.gridSize;
  const board = state.p1Board;
  const available: { r: number; c: number }[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 'empty' || board[r][c] === 'ship') {
        available.push({ r, c });
      }
    }
  }

  let target: { r: number; c: number };

  if (difficulty === 'easy' || state.botHits.length === 0) {
    target = available[Math.floor(Math.random() * available.length)];
  } else {
    // Medium / Hard / Master: Hunt around previous hits
    const lastHit = state.botHits[state.botHits.length - 1];
    const neighbors: { r: number; c: number }[] = [
      { r: lastHit.r - 1, c: lastHit.c },
      { r: lastHit.r + 1, c: lastHit.c },
      { r: lastHit.r, c: lastHit.c - 1 },
      { r: lastHit.r, c: lastHit.c + 1 },
    ].filter(
      (p) =>
        p.r >= 0 &&
        p.r < size &&
        p.c >= 0 &&
        p.c < size &&
        (board[p.r][p.c] === 'empty' || board[p.r][p.c] === 'ship'),
    );

    if (neighbors.length > 0) {
      target = neighbors[Math.floor(Math.random() * neighbors.length)];
    } else {
      target = available[Math.floor(Math.random() * available.length)];
    }
  }

  const shot = fireShot(state, 'p2', target.r, target.c);
  if (!shot) {
    return { nextState: state, result: 'miss', target };
  }

  const isHit = shot.result === 'hit' || shot.result === 'sunk';
  const newBotHits = isHit ? [...state.botHits, target] : state.botHits;
  const msg = isHit
    ? "L'avversario ha colpito una tua nave!"
    : "L'avversario ha fatto acqua! Tocca a te!";

  return {
    nextState: { ...shot.nextState, botHits: newBotHits, lastMessage: msg },
    result: shot.result,
    target,
  };
}
