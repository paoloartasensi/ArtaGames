import { Difficulty } from '../../types/game';

export type CheckersPiece = 'r' | 'b' | 'R' | 'B' | null;
// 'r' = Red (P1), 'R' = Red King, 'b' = Black (P2), 'B' = Black King

export interface CheckersMove {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  captures?: { r: number; c: number };
}

export interface CheckersState {
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
}

export function createInitialCheckersState(): CheckersState {
  const board: CheckersPiece[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Rows 0, 1, 2 = Black pieces ('b') on dark squares (r + c is odd)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = 'b';
      }
    }
  }

  // Rows 5, 6, 7 = Red pieces ('r') on dark squares
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = 'r';
      }
    }
  }

  return {
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

export function getAllMovesForPlayer(board: CheckersPiece[][], turn: 'r' | 'b'): CheckersMove[] {
  const moves: CheckersMove[] = [];
  const jumps: CheckersMove[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && isPieceOfCurrentPlayer(piece, turn)) {
        const pieceMoves = getMovesForPiece(board, r, c);
        for (const m of pieceMoves) {
          if (m.captures) {
            jumps.push(m);
          } else {
            moves.push(m);
          }
        }
      }
    }
  }

  // If there are jumps available, jumps are prioritized (standard checkers rule)
  return jumps.length > 0 ? jumps : moves;
}

export function getMovesForPiece(board: CheckersPiece[][], r: number, c: number): CheckersMove[] {
  const piece = board[r][c];
  if (!piece) return [];

  const moves: CheckersMove[] = [];
  const isKing = piece === 'R' || piece === 'B';
  const player = piece.toLowerCase() as 'r' | 'b';

  // Movement directions
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

export function applyCheckersMove(state: CheckersState, move: CheckersMove): CheckersState {
  const newBoard = state.board.map((row) => [...row]);
  const piece = newBoard[move.fromR][move.fromC];
  if (!piece) return state;

  newBoard[move.fromR][move.fromC] = null;

  let isPromotion = false;
  let finalPiece = piece;

  // King promotion check
  if (piece === 'r' && move.toR === 0) {
    finalPiece = 'R';
    isPromotion = true;
  } else if (piece === 'b' && move.toR === 7) {
    finalPiece = 'B';
    isPromotion = true;
  }

  newBoard[move.toR][move.toC] = finalPiece;

  let newRedCaptured = state.redCaptured;
  let newBlackCaptured = state.blackCaptured;

  if (move.captures) {
    newBoard[move.captures.r][move.captures.c] = null;
    if (state.turn === 'r') {
      newBlackCaptured++;
    } else {
      newRedCaptured++;
    }
  }

  // Check for multi-jump if captured and not newly promoted
  if (move.captures && !isPromotion) {
    const additionalJumps = getMovesForPiece(newBoard, move.toR, move.toC).filter((m) => !!m.captures);
    if (additionalJumps.length > 0) {
      return {
        ...state,
        board: newBoard,
        redCaptured: newRedCaptured,
        blackCaptured: newBlackCaptured,
        activeJumpPiece: { r: move.toR, c: move.toC },
        selectedPiece: { r: move.toR, c: move.toC },
        validMoves: additionalJumps,
        moveHistory: [...state.moveHistory, { fromR: move.fromR, fromC: move.fromC, toR: move.toR, toC: move.toC }],
      };
    }
  }

  // Normal turn pass
  const nextTurn: 'r' | 'b' = state.turn === 'r' ? 'b' : 'r';
  const opponentMoves = getAllMovesForPlayer(newBoard, nextTurn);

  let gameOver = false;
  let winner: 'r' | 'b' | 'draw' | null = null;

  if (opponentMoves.length === 0) {
    gameOver = true;
    winner = state.turn;
  }

  return {
    board: newBoard,
    turn: nextTurn,
    selectedPiece: null,
    validMoves: [],
    redCaptured: newRedCaptured,
    blackCaptured: newBlackCaptured,
    activeJumpPiece: null,
    gameOver,
    winner,
    moveHistory: [...state.moveHistory, { fromR: move.fromR, fromC: move.fromC, toR: move.toR, toC: move.toC }],
  };
}

export function getBotCheckersMove(state: CheckersState, difficulty: Difficulty): CheckersMove | null {
  const allMoves = state.activeJumpPiece
    ? getMovesForPiece(state.board, state.activeJumpPiece.r, state.activeJumpPiece.c).filter((m) => !!m.captures)
    : getAllMovesForPlayer(state.board, state.turn);

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
