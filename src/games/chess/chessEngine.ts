import { Difficulty } from '../../types/game';

export type ChessColor = 'w' | 'b';
export type ChessPieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

export interface ChessPiece {
  type: ChessPieceType;
  color: ChessColor;
}

export interface ChessMove {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  captured?: ChessPiece;
  isPromotion?: boolean;
}

export interface ChessState {
  board: (ChessPiece | null)[][];
  turn: ChessColor;
  selectedPos: { r: number; c: number } | null;
  validMoves: ChessMove[];
  whiteCaptured: ChessPiece[];
  blackCaptured: ChessPiece[];
  inCheck: boolean;
  gameOver: boolean;
  winner: ChessColor | 'draw' | null;
  moveHistory: ChessMove[];
  quietPlies?: number; // plies since the last capture or pawn move (50-move rule)
  /** Easy kids' rules: no check/checkmate, you win by capturing the King. */
  kingCapture?: boolean;
}

/** 'classic' = real rules (checkmate); 'kids' = win by capturing the King. */
export type ChessVariant = 'classic' | 'kids';

export function createInitialChessState(variant: ChessVariant = 'classic'): ChessState {
  const board: (ChessPiece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Black pieces (row 0 & 1)
  const backRow: ChessPieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRow[c], color: 'b' };
    board[1][c] = { type: 'p', color: 'b' };
  }

  // White pieces (row 6 & 7)
  for (let c = 0; c < 8; c++) {
    board[6][c] = { type: 'p', color: 'w' };
    board[7][c] = { type: backRow[c], color: 'w' };
  }

  return {
    board,
    turn: 'w',
    selectedPos: null,
    validMoves: [],
    whiteCaptured: [],
    blackCaptured: [],
    inCheck: false,
    gameOver: false,
    winner: null,
    moveHistory: [],
    quietPlies: 0,
    kingCapture: variant === 'kids',
  };
}

export function getPieceMoves(board: (ChessPiece | null)[][], r: number, c: number): ChessMove[] {
  const piece = board[r][c];
  if (!piece) return [];

  const moves: ChessMove[] = [];
  const color = piece.color;
  const oppColor: ChessColor = color === 'w' ? 'b' : 'w';

  // 1. Pawn
  if (piece.type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const promoRow = color === 'w' ? 0 : 7;

    // 1 step forward
    const f1R = r + dir;
    if (f1R >= 0 && f1R < 8 && board[f1R][c] === null) {
      moves.push({
        fromR: r,
        fromC: c,
        toR: f1R,
        toC: c,
        isPromotion: f1R === promoRow,
      });

      // 2 steps forward from start
      const f2R = r + dir * 2;
      if (r === startRow && board[f2R][c] === null) {
        moves.push({
          fromR: r,
          fromC: c,
          toR: f2R,
          toC: c,
        });
      }
    }

    // Diagonal captures
    for (const dc of [-1, 1]) {
      const capR = r + dir;
      const capC = c + dc;
      if (capR >= 0 && capR < 8 && capC >= 0 && capC < 8) {
        const dest = board[capR][capC];
        if (dest && dest.color === oppColor) {
          moves.push({
            fromR: r,
            fromC: c,
            toR: capR,
            toC: capC,
            captured: dest,
            isPromotion: capR === promoRow,
          });
        }
      }
    }
  }

  // 2. Knight
  if (piece.type === 'n') {
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of offsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const dest = board[nr][nc];
        if (!dest || dest.color === oppColor) {
          moves.push({
            fromR: r,
            fromC: c,
            toR: nr,
            toC: nc,
            captured: dest || undefined,
          });
        }
      }
    }
  }

  // 3. Bishop, Rook, Queen ray casters
  const checkRays = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

        const dest = board[nr][nc];
        if (!dest) {
          moves.push({ fromR: r, fromC: c, toR: nr, toC: nc });
        } else {
          if (dest.color === oppColor) {
            moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, captured: dest });
          }
          break; // Ray blocked
        }
        step++;
      }
    }
  };

  const straightDirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const diagonalDirs: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  if (piece.type === 'r') checkRays(straightDirs);
  if (piece.type === 'b') checkRays(diagonalDirs);
  if (piece.type === 'q') checkRays([...straightDirs, ...diagonalDirs]);

  // 4. King
  if (piece.type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const dest = board[nr][nc];
          if (!dest || dest.color === oppColor) {
            moves.push({ fromR: r, fromC: c, toR: nr, toC: nc, captured: dest || undefined });
          }
        }
      }
    }
  }

  return moves;
}

export function getAllMovesForColor(board: (ChessPiece | null)[][], color: ChessColor): ChessMove[] {
  const allMoves: ChessMove[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        allMoves.push(...getPieceMoves(board, r, c));
      }
    }
  }
  return allMoves;
}

export function isKingInCheck(board: (ChessPiece | null)[][], color: ChessColor): boolean {
  // Find King
  let kingR = -1;
  let kingC = -1;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) {
        kingR = r;
        kingC = c;
        break;
      }
    }
    if (kingR !== -1) break;
  }

  if (kingR === -1) return false;

  const oppColor: ChessColor = color === 'w' ? 'b' : 'w';
  const oppMoves = getAllMovesForColor(board, oppColor);
  return oppMoves.some((m) => m.toR === kingR && m.toC === kingC);
}

/** Only kings, or king + one bishop/knight against a lone king: nobody can checkmate. */
function insufficientMaterial(board: (ChessPiece | null)[][]): boolean {
  const others: ChessPiece[] = [];
  for (const row of board) for (const p of row) if (p && p.type !== 'k') others.push(p);
  return others.length === 0 || (others.length === 1 && (others[0].type === 'b' || others[0].type === 'n'));
}

function boardAfter(board: (ChessPiece | null)[][], m: ChessMove): (ChessPiece | null)[][] {
  const nb = board.map((row) => [...row]);
  const piece = nb[m.fromR][m.fromC];
  nb[m.fromR][m.fromC] = null;
  nb[m.toR][m.toC] =
    piece && piece.type === 'p' && (m.toR === 0 || m.toR === 7) ? { type: 'q', color: piece.color } : piece;
  return nb;
}

/** Legal moves of one piece: moves that would leave your own King in check are not allowed. */
export function getLegalPieceMoves(board: (ChessPiece | null)[][], r: number, c: number): ChessMove[] {
  const piece = board[r][c];
  if (!piece) return [];
  return getPieceMoves(board, r, c).filter((m) => !isKingInCheck(boardAfter(board, m), piece.color));
}

export function getLegalMovesForColor(board: (ChessPiece | null)[][], color: ChessColor): ChessMove[] {
  return getAllMovesForColor(board, color).filter((m) => !isKingInCheck(boardAfter(board, m), color));
}

/** Moves of one piece under the state's rules (kids' rules let you leave the King in danger). */
export function movesForPiece(state: ChessState, r: number, c: number): ChessMove[] {
  return state.kingCapture ? getPieceMoves(state.board, r, c) : getLegalPieceMoves(state.board, r, c);
}

export function movesForColor(state: ChessState, color: ChessColor): ChessMove[] {
  return state.kingCapture ? getAllMovesForColor(state.board, color) : getLegalMovesForColor(state.board, color);
}

export function applyChessMove(state: ChessState, move: ChessMove): ChessState {
  const newBoard = state.board.map((row) => [...row]);
  const piece = newBoard[move.fromR][move.fromC];
  if (!piece) return state;

  newBoard[move.fromR][move.fromC] = null;

  let placedPiece = piece;
  if (move.isPromotion || (piece.type === 'p' && (move.toR === 0 || move.toR === 7))) {
    placedPiece = { type: 'q', color: piece.color }; // Auto promote to Queen in Junior mode!
  }

  const capturedPiece = newBoard[move.toR][move.toC];
  newBoard[move.toR][move.toC] = placedPiece;

  const newWhiteCaptured = [...state.whiteCaptured];
  const newBlackCaptured = [...state.blackCaptured];

  if (capturedPiece) {
    if (capturedPiece.color === 'w') newBlackCaptured.push(capturedPiece);
    else newWhiteCaptured.push(capturedPiece);
  }

  const nextTurn: ChessColor = state.turn === 'w' ? 'b' : 'w';

  // Check victory condition: King captured (fun for 5-7 yo!)
  let gameOver = false;

  let winnerOrDraw: ChessColor | 'draw' | null = null;
  if (capturedPiece && capturedPiece.type === 'k') {
    gameOver = true;
    winnerOrDraw = state.turn;
  }

  const quietPlies = capturedPiece || piece.type === 'p' ? 0 : (state.quietPlies || 0) + 1;

  if (gameOver) {
    // King captured: kids' rules win (with real rules it can't happen)
  } else if (state.kingCapture) {
    // Kids' rules: no checkmate or stalemate, only a long draw if nobody makes progress
    if (getAllMovesForColor(newBoard, nextTurn).length === 0 || quietPlies >= 100) {
      gameOver = true;
      winnerOrDraw = 'draw';
    }
  } else if (getLegalMovesForColor(newBoard, nextTurn).length === 0) {
    // No legal move: checkmate if in check, otherwise stalemate (draw)
    gameOver = true;
    winnerOrDraw = isKingInCheck(newBoard, nextTurn) ? state.turn : 'draw';
  } else if (quietPlies >= 100 || insufficientMaterial(newBoard)) {
    // 50 moves each without captures or pawn moves, or not enough pieces to checkmate
    gameOver = true;
    winnerOrDraw = 'draw';
  }

  const inCheck = isKingInCheck(newBoard, nextTurn);

  return {
    board: newBoard,
    turn: nextTurn,
    selectedPos: null,
    validMoves: [],
    whiteCaptured: newWhiteCaptured,
    blackCaptured: newBlackCaptured,
    inCheck,
    gameOver,
    winner: winnerOrDraw,
    quietPlies,
    kingCapture: state.kingCapture,
    moveHistory: [...state.moveHistory, move],
  };
}

const PIECE_VALUES: Record<ChessPieceType, number> = {
  p: 10,
  n: 30,
  b: 32,
  r: 50,
  q: 90,
  k: 900,
};

export function getBotChessMove(state: ChessState, difficulty: Difficulty): ChessMove | null {
  const allMoves = movesForColor(state, state.turn);
  if (allMoves.length === 0) return null;

  // Kids' rules: always grab the King if you can, and never leave yours to be taken
  if (state.kingCapture) {
    const kingTake = allMoves.find((m) => m.captured?.type === 'k');
    if (kingTake) return kingTake;
  }

  if (difficulty === 'easy') {
    // 5-6 yo bot: random move, 30% chance to take free piece
    const captures = allMoves.filter((m) => !!m.captured);
    if (captures.length > 0 && Math.random() < 0.3) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return allMoves[Math.floor(Math.random() * allMoves.length)];
  }

  // Medium / Hard / Master: Evaluate capture values and center occupation
  const scoredMoves = allMoves.map((m) => {
    let score = 0;
    if (m.captured) {
      score += PIECE_VALUES[m.captured.type] * 2;
    }
    if (m.isPromotion) {
      score += 70;
    }

    // Center preference (rows 3, 4, cols 3, 4)
    if ((m.toR === 3 || m.toR === 4) && (m.toC === 3 || m.toC === 4)) {
      score += 5;
    }

    // Protect from hanging if hard/master
    if (difficulty === 'hard' || difficulty === 'master') {
      const movingPiece = state.board[m.fromR][m.fromC];
      if (movingPiece && movingPiece.type === 'k') {
        score -= 2; // don't wander with king early
      }
    }

    const after = boardAfter(state.board, m);
    const opp: ChessColor = state.turn === 'w' ? 'b' : 'w';
    if (isKingInCheck(after, opp)) {
      score += !state.kingCapture && getLegalMovesForColor(after, opp).length === 0 ? 10000 : 6; // mate / check
    }
    if (state.kingCapture && isKingInCheck(after, state.turn)) {
      score -= 5000; // would leave our King to be captured
    }
    if (difficulty === 'hard' || difficulty === 'master') {
      // Don't leave the moved piece where it can be taken for free
      const attacked = getAllMovesForColor(after, opp).some((x) => x.toR === m.toR && x.toC === m.toC);
      const mover = state.board[m.fromR][m.fromC];
      if (attacked && mover) score -= PIECE_VALUES[mover.type] * 0.8;
    }

    score += Math.random() * 2;
    return { move: m, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}
