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
}

export function createInitialChessState(): ChessState {
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
  let winner: ChessColor | null = null;

  if (capturedPiece && capturedPiece.type === 'k') {
    gameOver = true;
    winner = state.turn;
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
    winner,
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
  const allMoves = getAllMovesForColor(state.board, state.turn);
  if (allMoves.length === 0) return null;

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

    score += Math.random() * 2;
    return { move: m, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}
