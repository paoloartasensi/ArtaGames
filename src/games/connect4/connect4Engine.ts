import { Difficulty } from '../../types/game';

export type ConnectCell = 'red' | 'yellow' | null;

export interface WinningLine {
  cells: { r: number; c: number }[];
  winner: 'red' | 'yellow';
}

export interface Connect4State {
  board: ConnectCell[][]; // 6 rows, 7 cols. [0][c] is top, [5][c] is bottom
  turn: 'red' | 'yellow';
  winningLine: WinningLine | null;
  gameOver: boolean;
  winner: 'red' | 'yellow' | 'draw' | null;
  lastDrop: { r: number; c: number } | null;
  history: { col: number; player: 'red' | 'yellow' }[];
}

export const ROWS = 6;
export const COLS = 7;

export function createInitialConnect4State(): Connect4State {
  return {
    board: Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null)),
    turn: 'red',
    winningLine: null,
    gameOver: false,
    winner: null,
    lastDrop: null,
    history: [],
  };
}

export function getLowestEmptyRow(board: ConnectCell[][], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      return r;
    }
  }
  return -1; // Column full
}

export function checkConnect4Win(board: ConnectCell[][]): WinningLine | null {
  // Horizontal check
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p && p === board[r][c + 1] && p === board[r][c + 2] && p === board[r][c + 3]) {
        return {
          winner: p,
          cells: [
            { r, c },
            { r, c: c + 1 },
            { r, c: c + 2 },
            { r, c: c + 3 },
          ],
        };
      }
    }
  }

  // Vertical check
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const p = board[r][c];
      if (p && p === board[r + 1][c] && p === board[r + 2][c] && p === board[r + 3][c]) {
        return {
          winner: p,
          cells: [
            { r, c },
            { r: r + 1, c },
            { r: r + 2, c },
            { r: r + 3, c },
          ],
        };
      }
    }
  }

  // Diagonal Down-Right (\)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p && p === board[r + 1][c + 1] && p === board[r + 2][c + 2] && p === board[r + 3][c + 3]) {
        return {
          winner: p,
          cells: [
            { r, c },
            { r: r + 1, c: c + 1 },
            { r: r + 2, c: c + 2 },
            { r: r + 3, c: c + 3 },
          ],
        };
      }
    }
  }

  // Diagonal Up-Right (/)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p && p === board[r - 1][c + 1] && p === board[r - 2][c + 2] && p === board[r - 3][c + 3]) {
        return {
          winner: p,
          cells: [
            { r, c },
            { r: r - 1, c: c + 1 },
            { r: r - 2, c: c + 2 },
            { r: r - 3, c: c + 3 },
          ],
        };
      }
    }
  }

  return null;
}

export function isBoardFull(board: ConnectCell[][]): boolean {
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) return false;
  }
  return true;
}

export function dropConnectPiece(state: Connect4State, col: number): Connect4State | null {
  if (state.gameOver || col < 0 || col >= COLS) return null;

  const targetRow = getLowestEmptyRow(state.board, col);
  if (targetRow === -1) return null; // Col is full

  const newBoard = state.board.map((row) => [...row]);
  newBoard[targetRow][col] = state.turn;

  const win = checkConnect4Win(newBoard);
  const full = isBoardFull(newBoard);

  const nextTurn: 'red' | 'yellow' = state.turn === 'red' ? 'yellow' : 'red';

  return {
    board: newBoard,
    turn: nextTurn,
    winningLine: win,
    gameOver: !!win || full,
    winner: win ? win.winner : full ? 'draw' : null,
    lastDrop: { r: targetRow, c: col },
    history: [...state.history, { col, player: state.turn }],
  };
}

export function getBotConnect4Move(state: Connect4State, difficulty: Difficulty): number {
  const validCols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (state.board[0][c] === null) {
      validCols.push(c);
    }
  }

  if (validCols.length === 0) return 0;

  const botPlayer = state.turn;
  const humanPlayer: 'red' | 'yellow' = botPlayer === 'red' ? 'yellow' : 'red';

  // 1. Can bot win immediately?
  for (const c of validCols) {
    const r = getLowestEmptyRow(state.board, c);
    const testBoard = state.board.map((row) => [...row]);
    testBoard[r][c] = botPlayer;
    if (checkConnect4Win(testBoard)) {
      return c;
    }
  }

  if (difficulty === 'easy') {
    // 5-6 year old mode: picks random column, with preference for middle
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  // 2. Can opponent win next turn? If so, block!
  for (const c of validCols) {
    const r = getLowestEmptyRow(state.board, c);
    const testBoard = state.board.map((row) => [...row]);
    testBoard[r][c] = humanPlayer;
    if (checkConnect4Win(testBoard)) {
      return c;
    }
  }

  // 3. Positional weighting (center column 3 is king)
  const colScores: { col: number; score: number }[] = validCols.map((c) => {
    let score = 0;
    // Prefer center column 3, then 2 and 4
    if (c === 3) score += 8;
    else if (c === 2 || c === 4) score += 5;
    else if (c === 1 || c === 5) score += 2;

    const r = getLowestEmptyRow(state.board, c);

    // Avoid giving opponent a winning move on the cell directly above ours!
    if (r > 0 && (difficulty === 'hard' || difficulty === 'master')) {
      const testBoard = state.board.map((row) => [...row]);
      testBoard[r][c] = botPlayer;
      testBoard[r - 1][c] = humanPlayer;
      if (checkConnect4Win(testBoard)) {
        score -= 50; // Don't give away a win!
      }
    }

    score += Math.random() * 2;
    return { col: c, score };
  });

  colScores.sort((a, b) => b.score - a.score);
  return colScores[0].col;
}
