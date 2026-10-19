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

export interface BattleshipState {
  gridSize: number;
  playerShips: PlacedShip[];
  enemyShips: PlacedShip[];
  playerBoard: CellState[][]; // where enemy fires
  enemyBoard: CellState[][];  // where player fires
  turn: 'player' | 'enemy';
  phase: 'placement' | 'battle' | 'game_over';
  winner: 'player' | 'enemy' | null;
  lastMessage: string;
  // Bot AI targeting memory
  botHits: { r: number; c: number }[];
}

export function createInitialBattleshipState(gridSize: number = 8): BattleshipState {
  const pBoard = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill('empty' as CellState));
  const eBoard = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill('empty' as CellState));

  // Automatically place player fleet by default so kids can start immediately or re-arrange
  const pShips = generateRandomFleet(gridSize, FLEET_CONFIG);
  pShips.forEach((ship) => {
    for (let i = 0; i < ship.size; i++) {
      const r = ship.horizontal ? ship.r : ship.r + i;
      const c = ship.horizontal ? ship.c + i : ship.c;
      pBoard[r][c] = 'ship';
    }
  });

  const eShips = generateRandomFleet(gridSize, FLEET_CONFIG);

  return {
    gridSize,
    playerShips: pShips,
    enemyShips: eShips,
    playerBoard: pBoard,
    enemyBoard: eBoard,
    turn: 'player',
    phase: 'battle',
    winner: null,
    lastMessage: 'Tocca una casella sulla griglia radar per sparare!',
    botHits: [],
  };
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

export function fireShotAtEnemy(state: BattleshipState, r: number, c: number): {
  nextState: BattleshipState;
  result: 'hit' | 'miss' | 'sunk';
  sunkShipName?: string;
} | null {
  if (state.phase !== 'battle' || state.turn !== 'player') return null;
  if (state.enemyBoard[r][c] === 'hit' || state.enemyBoard[r][c] === 'miss') return null;

  const newEnemyBoard = state.enemyBoard.map((row) => [...row]);
  const newEnemyShips = state.enemyShips.map((s) => ({ ...s }));

  // Check if any enemy ship occupies (r, c)
  let hitShip: PlacedShip | null = null;
  for (const ship of newEnemyShips) {
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
    newEnemyBoard[r][c] = 'hit';
    hitShip.hits += 1;
    if (hitShip.hits >= hitShip.size) {
      hitShip.sunk = true;
      result = 'sunk';
      sunkShipName = hitShip.name;
    } else {
      result = 'hit';
    }
  } else {
    newEnemyBoard[r][c] = 'miss';
    result = 'miss';
  }

  // Check all sunk
  const allSunk = newEnemyShips.every((s) => s.sunk);
  const gameOver = allSunk;
  const winner = allSunk ? 'player' : null;

  let msg = 'Acqua! Prova un\'altra zona.';
  if (result === 'sunk') msg = `BOOM! Hai affondato: ${sunkShipName}! 🎯`;
  else if (result === 'hit') msg = 'COLPITO! Una nave nemica è stata centrata! 🔥';

  const nextState: BattleshipState = {
    ...state,
    enemyBoard: newEnemyBoard,
    enemyShips: newEnemyShips,
    turn: gameOver ? 'player' : 'enemy',
    phase: gameOver ? 'game_over' : 'battle',
    winner,
    lastMessage: msg,
  };

  return { nextState, result, sunkShipName };
}

export function fireBotShot(state: BattleshipState, difficulty: Difficulty): {
  nextState: BattleshipState;
  result: 'hit' | 'miss' | 'sunk';
  target: { r: number; c: number };
} {
  const size = state.gridSize;
  const board = state.playerBoard;
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
    ].filter((p) => p.r >= 0 && p.r < size && p.c >= 0 && p.c < size && (board[p.r][p.c] === 'empty' || board[p.r][p.c] === 'ship'));

    if (neighbors.length > 0) {
      target = neighbors[Math.floor(Math.random() * neighbors.length)];
    } else {
      target = available[Math.floor(Math.random() * available.length)];
    }
  }

  const newPlayerBoard = board.map((row) => [...row]);
  const newPlayerShips = state.playerShips.map((s) => ({ ...s }));
  const cellVal = board[target.r][target.c];

  let result: 'hit' | 'miss' | 'sunk' = 'miss';
  const newBotHits = [...state.botHits];

  if (cellVal === 'ship') {
    newPlayerBoard[target.r][target.c] = 'hit';
    newBotHits.push(target);

    // Find ship
    for (const ship of newPlayerShips) {
      for (let i = 0; i < ship.size; i++) {
        const sr = ship.horizontal ? ship.r : ship.r + i;
        const sc = ship.horizontal ? ship.c + i : ship.c;
        if (sr === target.r && sc === target.c) {
          ship.hits += 1;
          if (ship.hits >= ship.size) {
            ship.sunk = true;
            result = 'sunk';
          } else {
            result = 'hit';
          }
          break;
        }
      }
    }
  } else {
    newPlayerBoard[target.r][target.c] = 'miss';
    result = 'miss';
  }

  const allPlayerSunk = newPlayerShips.every((s) => s.sunk);
  const gameOver = allPlayerSunk;
  const winner = allPlayerSunk ? 'enemy' : null;

  const nextState: BattleshipState = {
    ...state,
    playerBoard: newPlayerBoard,
    playerShips: newPlayerShips,
    turn: gameOver ? 'enemy' : 'player',
    phase: gameOver ? 'game_over' : 'battle',
    winner,
    botHits: newBotHits,
    lastMessage: result === 'hit' || result === 'sunk' ? 'L\'avversario ha colpito una tua nave!' : 'L\'avversario ha fatto acqua! Tocca a te!',
  };

  return { nextState, result, target };
}
