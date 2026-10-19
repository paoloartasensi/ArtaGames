import { Difficulty } from '../../types/game';

export type DBPlayer = 0 | 1;

// Grid of dots: 5x5 dots -> 4x4 boxes (16 boxes, good balance for kids).
export const DOTS_X = 5;
export const DOTS_Y = 5;
export const BOX_COLS = DOTS_X - 1;
export const BOX_ROWS = DOTS_Y - 1;

export type DBEdge =
  | { kind: 'h'; r: number; c: number } // horizontal: dot(r,c) -> dot(r,c+1)
  | { kind: 'v'; r: number; c: number }; // vertical: dot(r,c) -> dot(r+1,c)

export interface DotsBoxesState {
  hEdges: boolean[][]; // DOTS_Y rows x BOX_COLS cols
  vEdges: boolean[][]; // BOX_ROWS rows x DOTS_X cols
  boxes: (DBPlayer | null)[]; // BOX_ROWS x BOX_COLS
  turn: DBPlayer;
  scores: [number, number];
  gameOver: boolean;
  winner: DBPlayer | 'draw' | null;
  lastBox: { r: number; c: number } | null;
}

export function createInitialDotsBoxesState(): DotsBoxesState {
  return {
    hEdges: Array.from({ length: DOTS_Y }, () => Array(BOX_COLS).fill(false)),
    vEdges: Array.from({ length: BOX_ROWS }, () => Array(DOTS_X).fill(false)),
    boxes: Array(BOX_ROWS * BOX_COLS).fill(null),
    turn: 0,
    scores: [0, 0],
    gameOver: false,
    winner: null,
    lastBox: null,
  };
}

export function boxIndex(r: number, c: number): number {
  return r * BOX_COLS + c;
}

function isEdgeDrawn(state: DotsBoxesState, e: DBEdge): boolean {
  return e.kind === 'h' ? state.hEdges[e.r][e.c] : state.vEdges[e.r][e.c];
}

// The 1 or 2 boxes that share an edge.
function adjacentBoxes(e: DBEdge): { r: number; c: number }[] {
  const list: { r: number; c: number }[] = [];
  if (e.kind === 'h') {
    if (e.r - 1 >= 0) list.push({ r: e.r - 1, c: e.c });
    if (e.r < BOX_ROWS) list.push({ r: e.r, c: e.c });
  } else {
    if (e.c - 1 >= 0) list.push({ r: e.r, c: e.c - 1 });
    if (e.c < BOX_COLS) list.push({ r: e.r, c: e.c });
  }
  return list;
}

// How many of the 4 sides of box (r,c) are currently drawn.
function sideCount(state: DotsBoxesState, r: number, c: number): number {
  let n = 0;
  if (state.hEdges[r][c]) n++;
  if (state.hEdges[r + 1][c]) n++;
  if (state.vEdges[r][c]) n++;
  if (state.vEdges[r][c + 1]) n++;
  return n;
}

// Boxes that would be completed (still unowned, missing only this edge) by drawing `e`.
function completedBoxes(state: DotsBoxesState, e: DBEdge): { r: number; c: number }[] {
  return adjacentBoxes(e).filter(
    (b) => state.boxes[boxIndex(b.r, b.c)] === null && sideCount(state, b.r, b.c) === 3,
  );
}

// True if drawing `e` hands the opponent a capture (leaves a box with 3 sides).
function givesAwayBox(state: DotsBoxesState, e: DBEdge): boolean {
  return adjacentBoxes(e).some(
    (b) => state.boxes[boxIndex(b.r, b.c)] === null && sideCount(state, b.r, b.c) === 2,
  );
}

export function drawEdge(state: DotsBoxesState, e: DBEdge): DotsBoxesState | null {
  if (state.gameOver || isEdgeDrawn(state, e)) return null;

  const hEdges = state.hEdges.map((row) => [...row]);
  const vEdges = state.vEdges.map((row) => [...row]);
  if (e.kind === 'h') hEdges[e.r][e.c] = true;
  else vEdges[e.r][e.c] = true;

  const completed = completedBoxes(state, e);

  if (completed.length > 0) {
    const boxes = [...state.boxes];
    const scores: [number, number] = [...state.scores];
    for (const b of completed) {
      boxes[boxIndex(b.r, b.c)] = state.turn;
      scores[state.turn]++;
    }
    const allOwned = boxes.every((x) => x !== null);
    return {
      hEdges,
      vEdges,
      boxes,
      turn: state.turn, // captures keep the turn
      scores,
      gameOver: allOwned,
      winner: allOwned ? (scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : 'draw') : null,
      lastBox: completed[completed.length - 1],
    };
  }

  return {
    hEdges,
    vEdges,
    boxes: state.boxes,
    turn: (1 - state.turn) as DBPlayer,
    scores: state.scores,
    gameOver: false,
    winner: null,
    lastBox: null,
  };
}

export function getAvailableEdges(state: DotsBoxesState): DBEdge[] {
  const out: DBEdge[] = [];
  for (let r = 0; r < DOTS_Y; r++)
    for (let c = 0; c < BOX_COLS; c++) if (!state.hEdges[r][c]) out.push({ kind: 'h', r, c });
  for (let r = 0; r < BOX_ROWS; r++)
    for (let c = 0; c < DOTS_X; c++) if (!state.vEdges[r][c]) out.push({ kind: 'v', r, c });
  return out;
}

export function getBotDotsBoxesEdge(state: DotsBoxesState, difficulty: Difficulty): DBEdge {
  const edges = getAvailableEdges(state);
  if (edges.length === 0) return { kind: 'h', r: 0, c: 0 };

  // Always grab an available capture (even on easy, it's satisfying for kids).
  const captures = edges.filter((e) => completedBoxes(state, e).length > 0);
  if (captures.length > 0) {
    captures.sort((a, b) => completedBoxes(state, b).length - completedBoxes(state, a).length);
    return captures[0];
  }

  if (difficulty === 'easy') {
    return edges[Math.floor(Math.random() * edges.length)];
  }

  // Otherwise avoid handing the opponent a box.
  const safe = edges.filter((e) => !givesAwayBox(state, e));
  const pool = safe.length > 0 ? safe : edges;

  if (difficulty === 'medium') {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // hard/master: prefer edges that touch boxes with the fewest sides already.
  let best = pool[0];
  let bestScore = Infinity;
  for (const e of pool) {
    let s = 0;
    for (const b of adjacentBoxes(e)) {
      if (state.boxes[boxIndex(b.r, b.c)] === null) s += sideCount(state, b.r, b.c) * 10;
    }
    s += Math.random() * 3;
    if (s < bestScore) {
      bestScore = s;
      best = e;
    }
  }
  return best;
}
