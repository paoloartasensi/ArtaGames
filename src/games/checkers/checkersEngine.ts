import { Difficulty } from '../../types/game';

export type CheckersPiece = 'r' | 'b' | 'R' | 'B' | null;
// 'r' = Red (P1), 'R' = Red King, 'b' = Black (P2), 'B' = Black King

/**
 * 'american': English/American checkers — any piece may capture any piece, a capture is
 *             mandatory but the player may choose which one.
 * 'italian':  Dama italiana — a man can NOT capture a king, and the capture must follow the
 *             priority rules (most pieces, then with a king, then most kings, then king first).
 *             The board is mirrored (dark square in the bottom-right corner).
 */
export type CheckersVariant = 'american' | 'italian';

export interface CheckersMove {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  captures?: { r: number; c: number };
}

export interface CheckersState {
  variant: CheckersVariant;
  board: CheckersPiece[][];
  turn: 'r' | 'b';
  selectedPiece: { r: number; c: number } | null;
  validMoves: CheckersMove[];
  redCaptured: number;
  blackCaptured: number;
  gameOver: boolean;
  winner: 'r' | 'b' | 'draw' | null;
  activeJumpPiece: { r: number; c: number } | null; // For forced continuous jumps
  moveHistory: { fromR: number; fromC: number; toR: number; toC: number }[];
  quietMoves: number; // consecutive king moves without captures (draw rule)
}

// Patta: 40 mosse consecutive (20 per giocatore) di sole dame senza catture.
export const CHECKERS_DRAW_QUIET_MOVES = 40;

/** Playable (dark) squares: bottom-left is dark in American, bottom-right in Italian. */
export function isPlayableSquare(r: number, c: number, variant: CheckersVariant): boolean {
  return (r + c) % 2 === (variant === 'italian' ? 0 : 1);
}

export function createInitialCheckersState(variant: CheckersVariant = 'american'): CheckersState {
  const board: CheckersPiece[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!isPlayableSquare(r, c, variant)) continue;
      if (r < 3) board[r][c] = 'b'; // Black on top rows
      else if (r > 4) board[r][c] = 'r'; // Red on bottom rows
    }
  }

  return {
    variant,
    board,
    turn: 'r',
    selectedPiece: null,
    validMoves: [],
    redCaptured: 0,
    blackCaptured: 0,
    gameOver: false,
    winner: null,
    activeJumpPiece: null,
    moveHistory: [],
    quietMoves: 0,
  };
}

export function isPieceOfCurrentPlayer(piece: CheckersPiece, turn: 'r' | 'b'): boolean {
  if (!piece) return false;
  return turn === 'r' ? piece === 'r' || piece === 'R' : piece === 'b' || piece === 'B';
}

export function isPieceOfOpponent(piece: CheckersPiece, turn: 'r' | 'b'): boolean {
  if (!piece) return false;
  return turn === 'r' ? piece === 'b' || piece === 'B' : piece === 'r' || piece === 'R';
}

const isKingPiece = (p: CheckersPiece) => p === 'R' || p === 'B';

export function getMovesForPiece(
  board: CheckersPiece[][],
  r: number,
  c: number,
  variant: CheckersVariant = 'american'
): CheckersMove[] {
  const piece = board[r][c];
  if (!piece) return [];

  const moves: CheckersMove[] = [];
  const isKing = isKingPiece(piece);
  const player = piece.toLowerCase() as 'r' | 'b';

  // Red moves up (r - 1), Black moves down (r + 1). Kings move both ways.
  const rowDirs: number[] = [];
  if (player === 'r' || isKing) rowDirs.push(-1);
  if (player === 'b' || isKing) rowDirs.push(1);

  const colDirs = [-1, 1];

  // 1. Regular 1-step moves
  for (const dr of rowDirs) {
    for (const dc of colDirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === null) {
        moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
      }
    }
  }

  // 2. Jump moves (captures)
  for (const dr of rowDirs) {
    for (const dc of colDirs) {
      const midR = r + dr;
      const midC = c + dc;
      const jumpR = r + dr * 2;
      const jumpC = c + dc * 2;

      if (jumpR >= 0 && jumpR < 8 && jumpC >= 0 && jumpC < 8) {
        const midPiece = board[midR][midC];
        const destPiece = board[jumpR][jumpC];

        if (destPiece === null && midPiece && isPieceOfOpponent(midPiece, player)) {
          // Dama italiana: la pedina non può mangiare la dama
          if (variant === 'italian' && !isKing && isKingPiece(midPiece)) continue;
          moves.push({
            fromR: r,
            fromC: c,
            toR: jumpR,
            toC: jumpC,
            captures: { r: midR, c: midC },
          });
        }
      }
    }
  }

  return moves;
}

// ---------------------------------------------------------------------------
// Italian capture priority
// ---------------------------------------------------------------------------

interface CaptureScore {
  count: number; // pieces captured
  kings: number; // kings captured
  firstKing: number; // index of first king captured (lower is better), 99 if none
}

const betterScore = (a: CaptureScore, b: CaptureScore): number => {
  if (a.count !== b.count) return a.count - b.count;
  if (a.kings !== b.kings) return a.kings - b.kings;
  return b.firstKing - a.firstKing;
};

function applyJumpOnBoard(board: CheckersPiece[][], m: CheckersMove): { board: CheckersPiece[][]; promoted: boolean } {
  const nb = board.map((row) => [...row]);
  const piece = nb[m.fromR][m.fromC];
  nb[m.fromR][m.fromC] = null;
  if (m.captures) nb[m.captures.r][m.captures.c] = null;
  let promoted = false;
  let final = piece;
  if (piece === 'r' && m.toR === 0) {
    final = 'R';
    promoted = true;
  } else if (piece === 'b' && m.toR === 7) {
    final = 'B';
    promoted = true;
  }
  nb[m.toR][m.toC] = final;
  return { board: nb, promoted };
}

/** Best capture sequence that starts with jump `m` (depth = pieces already captured). */
function bestSequenceFrom(board: CheckersPiece[][], m: CheckersMove, variant: CheckersVariant, depth = 0): CaptureScore {
  const captured = board[m.captures!.r][m.captures!.c];
  const isK = isKingPiece(captured);
  const { board: nb, promoted } = applyJumpOnBoard(board, m);

  let best: CaptureScore = { count: 0, kings: 0, firstKing: 99 };
  if (!promoted) {
    for (const next of getMovesForPiece(nb, m.toR, m.toC, variant)) {
      if (!next.captures) continue;
      const s = bestSequenceFrom(nb, next, variant, depth + 1);
      if (betterScore(s, best) > 0) best = s;
    }
  }
  return {
    count: best.count + 1,
    kings: best.kings + (isK ? 1 : 0),
    firstKing: isK ? depth : best.firstKing,
  };
}

/** Keeps only the jumps allowed by the Italian priority rules. */
function filterItalianJumps(board: CheckersPiece[][], jumps: CheckersMove[]): CheckersMove[] {
  if (jumps.length <= 1) return jumps;
  const scored = jumps.map((m) => ({
    m,
    s: bestSequenceFrom(board, m, 'italian'),
    king: isKingPiece(board[m.fromR][m.fromC]),
  }));
  // 1. most pieces captured
  const maxCount = Math.max(...scored.map((x) => x.s.count));
  let pool = scored.filter((x) => x.s.count === maxCount);
  // 2. capture with a king rather than a man
  if (pool.some((x) => x.king)) pool = pool.filter((x) => x.king);
  // 3. most kings captured
  const maxKings = Math.max(...pool.map((x) => x.s.kings));
  pool = pool.filter((x) => x.s.kings === maxKings);
  // 4. capture the king as early as possible
  const minFirst = Math.min(...pool.map((x) => x.s.firstKing));
  pool = pool.filter((x) => x.s.firstKing === minFirst);
  return pool.map((x) => x.m);
}

export function getAllMovesForPlayer(
  board: CheckersPiece[][],
  turn: 'r' | 'b',
  variant: CheckersVariant = 'american'
): CheckersMove[] {
  const moves: CheckersMove[] = [];
  const jumps: CheckersMove[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && isPieceOfCurrentPlayer(piece, turn)) {
        for (const m of getMovesForPiece(board, r, c, variant)) {
          if (m.captures) jumps.push(m);
          else moves.push(m);
        }
      }
    }
  }

  // Captures are mandatory
  if (jumps.length > 0) {
    return variant === 'italian' ? filterItalianJumps(board, jumps) : jumps;
  }
  return moves;
}

/** Jumps allowed to continue a multi-capture with the piece at (r, c). */
function getContinuationJumps(board: CheckersPiece[][], r: number, c: number, variant: CheckersVariant): CheckersMove[] {
  const jumps = getMovesForPiece(board, r, c, variant).filter((m) => !!m.captures);
  return variant === 'italian' ? filterItalianJumps(board, jumps) : jumps;
}

/** All legal moves for the side to move (handles multi-jump continuation). */
export function getLegalMoves(state: CheckersState): CheckersMove[] {
  if (state.activeJumpPiece) {
    return getContinuationJumps(state.board, state.activeJumpPiece.r, state.activeJumpPiece.c, state.variant);
  }
  return getAllMovesForPlayer(state.board, state.turn, state.variant);
}

export function applyCheckersMove(state: CheckersState, move: CheckersMove): CheckersState {
  const piece = state.board[move.fromR][move.fromC];
  if (!piece) return state;

  const { board: newBoard, promoted: isPromotion } = applyJumpOnBoard(state.board, move);

  let newRedCaptured = state.redCaptured;
  let newBlackCaptured = state.blackCaptured;

  if (move.captures) {
    if (state.turn === 'r') newBlackCaptured++;
    else newRedCaptured++;
  }

  const historyEntry = { fromR: move.fromR, fromC: move.fromC, toR: move.toR, toC: move.toC };

  // Multi-jump continues unless the piece has just been promoted
  if (move.captures && !isPromotion) {
    const additionalJumps = getContinuationJumps(newBoard, move.toR, move.toC, state.variant);
    if (additionalJumps.length > 0) {
      return {
        ...state,
        board: newBoard,
        redCaptured: newRedCaptured,
        blackCaptured: newBlackCaptured,
        activeJumpPiece: { r: move.toR, c: move.toC },
        selectedPiece: { r: move.toR, c: move.toC },
        validMoves: additionalJumps,
        quietMoves: 0,
        moveHistory: [...state.moveHistory, historyEntry],
      };
    }
  }

  // Normal turn pass
  const nextTurn: 'r' | 'b' = state.turn === 'r' ? 'b' : 'r';
  const opponentMoves = getAllMovesForPlayer(newBoard, nextTurn, state.variant);

  // Captures and pawn moves reset the draw counter; king-only shuffling increments it
  const quietMoves = move.captures || !isKingPiece(piece) ? 0 : state.quietMoves + 1;

  let gameOver = false;
  let winner: 'r' | 'b' | 'draw' | null = null;

  if (opponentMoves.length === 0) {
    gameOver = true;
    winner = state.turn;
  } else if (quietMoves >= CHECKERS_DRAW_QUIET_MOVES) {
    gameOver = true;
    winner = 'draw';
  }

  return {
    variant: state.variant,
    board: newBoard,
    turn: nextTurn,
    selectedPiece: null,
    validMoves: [],
    redCaptured: newRedCaptured,
    blackCaptured: newBlackCaptured,
    activeJumpPiece: null,
    gameOver,
    winner,
    quietMoves,
    moveHistory: [...state.moveHistory, historyEntry],
  };
}

/** Pieces of the current player that are forced to capture (empty if no capture is available). */
export function getForcedCapturePieces(state: CheckersState): { r: number; c: number }[] {
  if (state.activeJumpPiece) return [state.activeJumpPiece];
  const seen = new Set<string>();
  const out: { r: number; c: number }[] = [];
  for (const m of getLegalMoves(state)) {
    if (!m.captures) return [];
    const k = `${m.fromR},${m.fromC}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ r: m.fromR, c: m.fromC });
    }
  }
  return out;
}

export function getBotCheckersMove(state: CheckersState, difficulty: Difficulty): CheckersMove | null {
  const allMoves = getLegalMoves(state);

  if (allMoves.length === 0) return null;

  if (difficulty === 'easy') {
    // 5-6 year old friendly bot: picks random move
    return allMoves[Math.floor(Math.random() * allMoves.length)];
  }

  // Evaluate moves for Medium / Hard / Master
  const scoredMoves = allMoves.map((m) => {
    let score = 0;
    if (m.captures) score += 20;

    // Favor kinging
    if (state.turn === 'b' && m.toR === 7) score += 15;
    if (state.turn === 'r' && m.toR === 0) score += 15;

    // Favor center control (columns 2, 3, 4, 5)
    if (m.toC >= 2 && m.toC <= 5) score += 4;

    // Protect back rank for beginner defense
    if (difficulty === 'hard' || difficulty === 'master') {
      if (state.turn === 'b' && m.fromR === 0) score -= 3;
      if (state.turn === 'r' && m.fromR === 7) score -= 3;
    }

    score += Math.random() * 2;
    return { move: m, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}
