import { Difficulty } from '../../types/game';

export type AbaPlayer = 0 | 1;

export const ABA_EDGE = 4; // hexagon side length 5 -> |coord| <= 4

// The 6 neighbour directions in axial coordinates.
export const ABA_DIRS: { q: number; r: number }[] = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

export const abaKey = (q: number, r: number) => `${q},${r}`;
export const parseAbaKey = (k: string): { q: number; r: number } => {
  const [q, r] = k.split(',').map(Number);
  return { q, r };
};
const opposite = (d: number) => (d + 3) % 6;

export function isInsideAba(q: number, r: number): boolean {
  return q >= -ABA_EDGE && q <= ABA_EDGE && r >= -ABA_EDGE && r <= ABA_EDGE && q + r >= -ABA_EDGE && q + r <= ABA_EDGE;
}

export function getAllAbaCells(): { q: number; r: number }[] {
  const cells: { q: number; r: number }[] = [];
  for (let q = -ABA_EDGE; q <= ABA_EDGE; q++)
    for (let r = -ABA_EDGE; r <= ABA_EDGE; r++) if (isInsideAba(q, r)) cells.push({ q, r });
  return cells;
}

export interface AbaloneState {
  board: Record<string, AbaPlayer>; // only occupied cells
  turn: AbaPlayer;
  knockedOut: [number, number];
  gameOver: boolean;
  winner: AbaPlayer | null;
  lastMove: { from: string[]; to: string[]; knockedOff: string[] } | null;
}

export function createInitialAbaloneState(): AbaloneState {
  const board: Record<string, AbaPlayer> = {};
  // Black (0) at the top: 5 + 6 + 3 = 14 marbles.
  for (let q = 0; q <= 4; q++) board[abaKey(q, -4)] = 0;
  for (let q = -1; q <= 4; q++) board[abaKey(q, -3)] = 0;
  for (let q = 1; q <= 3; q++) board[abaKey(q, -2)] = 0;
  // White (1) at the bottom (180° mirror).
  for (let q = -4; q <= 0; q++) board[abaKey(q, 4)] = 1;
  for (let q = -4; q <= 1; q++) board[abaKey(q, 3)] = 1;
  for (let q = -3; q <= -1; q++) board[abaKey(q, 2)] = 1;
  return {
    board,
    turn: 0,
    knockedOut: [0, 0],
    gameOver: false,
    winner: null,
    lastMove: null,
  };
}

export function dirBetween(a: { q: number; r: number }, b: { q: number; r: number }): number | null {
  for (let i = 0; i < 6; i++) {
    if (a.q + ABA_DIRS[i].q === b.q && a.r + ABA_DIRS[i].r === b.r) return i;
  }
  return null;
}

export function edgeDist(q: number, r: number): number {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
}

// Extend a selection (an ordered straight line of the current player's marbles) by tapping `key`.
// Returns the new ordered selection, or null if it cannot extend (caller may restart to [key]).
export function extendAbaSelection(state: AbaloneState, selected: string[], key: string): string[] | null {
  if (state.board[key] !== state.turn) return null;
  if (selected.length === 0) return [key];
  if (selected.includes(key)) return selected;
  if (selected.length >= 3) return [key];

  const kp = parseAbaKey(key);

  if (selected.length === 1) {
    const d = dirBetween(parseAbaKey(selected[0]), kp);
    if (d === null) return [key]; // not adjacent -> restart single
    return [selected[0], key];
  }

  const a = parseAbaKey(selected[0]);
  const b = parseAbaKey(selected[1]);
  const axis = dirBetween(a, b);
  if (axis === null) return [key];

  const frontNext = { q: b.q + ABA_DIRS[axis].q, r: b.r + ABA_DIRS[axis].r };
  const backNext = { q: a.q - ABA_DIRS[axis].q, r: a.r - ABA_DIRS[axis].r };
  if (kp.q === frontNext.q && kp.r === frontNext.r) return [...selected, key];
  if (kp.q === backNext.q && kp.r === backNext.r) return [key, ...selected];
  return [key];
}

export interface AbaMove {
  group: string[]; // ordered, last element is the front (closest to travel direction)
  dir: number;
  from: string[];
  to: string[];
  oppCount: number;
  knockedOff: string[];
}

// Validate and describe a move: move `group` (current player's contiguous line) in `dir`.
export function buildAbaMove(state: AbaloneState, group: string[], dir: number): AbaMove | null {
  const opp = (1 - state.turn) as AbaPlayer;
  const d = ABA_DIRS[dir];

  const front = parseAbaKey(group[group.length - 1]);
  const frontQ = front.q + d.q;
  const frontR = front.r + d.r;
  if (!isInsideAba(frontQ, frontR)) return null; // can't move our own group off the board

  const frontKey = abaKey(frontQ, frontR);
  const frontVal = state.board[frontKey];

  const from = group;
  const to = group.map((k) => {
    const p = parseAbaKey(k);
    return abaKey(p.q + d.q, p.r + d.r);
  });

  if (frontVal === undefined) {
    // Simple move into an empty cell.
    return { group, dir, from, to, oppCount: 0, knockedOff: [] };
  }
  if (frontVal === state.turn) return null; // own marble in front
  if (frontVal !== opp) return null;

  // Opponent in front -> push. Gather the contiguous opponent run (max 3).
  const oppGroup: string[] = [frontKey];
  let cursor = { q: frontQ, r: frontR };
  while (oppGroup.length < 3) {
    const nq = cursor.q + d.q;
    const nr = cursor.r + d.r;
    if (!isInsideAba(nq, nr)) break;
    const nk = abaKey(nq, nr);
    if (state.board[nk] === opp) {
      oppGroup.push(nk);
      cursor = { q: nq, r: nr };
    } else break;
  }

  if (group.length <= oppGroup.length) return null; // need strictly more marbles to push

  const lastOpp = parseAbaKey(oppGroup[oppGroup.length - 1]);
  const bq = lastOpp.q + d.q;
  const br = lastOpp.r + d.r;
  if (!isInsideAba(bq, br)) {
    // Last opponent marble is knocked off the board.
    return { group, dir, from, to, oppCount: oppGroup.length, knockedOff: [oppGroup[oppGroup.length - 1]] };
  }
  if (state.board[abaKey(bq, br)] !== undefined) return null; // blocked beyond

  return { group, dir, from, to, oppCount: oppGroup.length, knockedOff: [] };
}

export function applyAbaMove(state: AbaloneState, move: AbaMove): AbaloneState {
  const opp = (1 - state.turn) as AbaPlayer;
  const d = ABA_DIRS[move.dir];
  const board: Record<string, AbaPlayer> = { ...state.board };

  // Move our group.
  for (const k of move.from) delete board[k];
  for (const k of move.to) board[k] = state.turn;

  // Shift the pushed opponent group.
  const front = parseAbaKey(move.group[move.group.length - 1]);
  const oppStart = { q: front.q + d.q, r: front.r + d.r };
  const oppKeys: string[] = [];
  for (let i = 0; i < move.oppCount; i++) {
    oppKeys.push(abaKey(oppStart.q + d.q * i, oppStart.r + d.r * i));
  }
  const knockedSet = new Set(move.knockedOff);
  for (const k of oppKeys) {
    delete board[k];
    if (knockedSet.has(k)) continue; // knocked off, not re-placed
    const p = parseAbaKey(k);
    board[abaKey(p.q + d.q, p.r + d.r)] = opp;
  }

  const knockedOut: [number, number] = [...state.knockedOut];
  knockedOut[opp] += move.knockedOff.length;
  const gameOver = knockedOut[opp] >= 6;

  return {
    board,
    turn: (1 - state.turn) as AbaPlayer,
    knockedOut,
    gameOver,
    winner: gameOver ? state.turn : null,
    lastMove: { from: move.from, to: move.to, knockedOff: move.knockedOff },
  };
}

// Resolve a component tap: selected marbles + a target cell -> new state (or null).
export function tryAbaMove(state: AbaloneState, selected: string[], targetKey: string): AbaloneState | null {
  if (selected.length === 0) return null;
  const target = parseAbaKey(targetKey);
  if (state.board[targetKey] === state.turn) return null; // own marble: handled by selection

  let group: string[];
  let dir: number;

  if (selected.length === 1) {
    const d = dirBetween(parseAbaKey(selected[0]), target);
    if (d === null) return null;
    group = [selected[0]];
    dir = d;
  } else {
    const a = parseAbaKey(selected[0]);
    const b = parseAbaKey(selected[1]);
    const axis = dirBetween(a, b);
    if (axis === null) return null;
    const frontNext = { q: b.q + ABA_DIRS[axis].q, r: b.r + ABA_DIRS[axis].r };
    const backNext = { q: a.q - ABA_DIRS[axis].q, r: a.r - ABA_DIRS[axis].r };
    if (target.q === frontNext.q && target.r === frontNext.r) {
      group = [...selected];
      dir = axis;
    } else if (target.q === backNext.q && target.r === backNext.r) {
      group = [...selected].reverse();
      dir = opposite(axis);
    } else return null;
  }

  const move = buildAbaMove(state, group, dir);
  if (!move) return null;
  return applyAbaMove(state, move);
}

export function getAllAbaMoves(state: AbaloneState, player: AbaPlayer): AbaMove[] {
  const moves: AbaMove[] = [];
  const seen = new Set<string>();
  const cells = Object.keys(state.board).filter((k) => state.board[k] === player);

  for (const ck of cells) {
    const c = parseAbaKey(ck);
    for (let d = 0; d < 6; d++) {
      // Build the maximal forward run (max 3) starting at c in direction d.
      const group: string[] = [ck];
      let cursor = { q: c.q, r: c.r };
      while (group.length < 3) {
        const nq = cursor.q + ABA_DIRS[d].q;
        const nr = cursor.r + ABA_DIRS[d].r;
        if (!isInsideAba(nq, nr)) break;
        const nk = abaKey(nq, nr);
        if (state.board[nk] === player) {
          group.push(nk);
          cursor = { q: nq, r: nr };
        } else break;
      }

      const attempts: { group: string[]; dir: number }[] = [
        { group, dir: d },
        { group: [...group].reverse(), dir: opposite(d) },
      ];
      for (const a of attempts) {
        const move = buildAbaMove(state, a.group, a.dir);
        if (move) {
          const sig = move.from.join('|') + '>' + move.to.join('|');
          if (!seen.has(sig)) {
            seen.add(sig);
            moves.push(move);
          }
        }
      }
    }
  }
  return moves;
}

export function getBotAbaMove(state: AbaloneState, difficulty: Difficulty): AbaMove | null {
  const moves = getAllAbaMoves(state, state.turn);
  if (moves.length === 0) return null;
  if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];

  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    let s = 0;
    if (m.knockedOff.length > 0) s += 1000; // knocking a marble off is huge
    if (m.oppCount > 0) s += 50 + m.oppCount * 20; // a sumito push
    s += m.group.length * 2; // moving in groups is often good
    // Prefer our leading marble ending up toward the centre (safer from being pushed off).
    const frontTo = parseAbaKey(m.to[m.to.length - 1]);
    s += (ABA_EDGE - edgeDist(frontTo.q, frontTo.r)) * 4;
    s += Math.random() * 6;
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return best;
}
