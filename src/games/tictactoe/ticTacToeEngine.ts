import { Difficulty } from '../../types/game';

export type TTTCell = 'X' | 'O' | null;

export interface TicTacToeState {
  board: TTTCell[];
  turn: 'X' | 'O';
  winningLine: number[] | null;
  gameOver: boolean;
  winner: 'X' | 'O' | 'draw' | null;
}

export function createInitialTTTState(): TicTacToeState {
  return {
    board: Array(9).fill(null),
    turn: 'X',
    winningLine: null,
    gameOver: false,
    winner: null,
  };
}

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],           // diags
];

export function checkTTTWin(board: TTTCell[]): { winner: 'X' | 'O'; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'X' | 'O', line };
    }
  }
  return null;
}

export function playTTTMove(state: TicTacToeState, idx: number): TicTacToeState | null {
  if (state.gameOver || state.board[idx] !== null) return null;

  const newBoard = [...state.board];
  newBoard[idx] = state.turn;

  const win = checkTTTWin(newBoard);
  const isDraw = !win && newBoard.every((cell) => cell !== null);

  return {
    board: newBoard,
    turn: state.turn === 'X' ? 'O' : 'X',
    winningLine: win ? win.line : null,
    gameOver: !!win || isDraw,
    winner: win ? win.winner : isDraw ? 'draw' : null,
  };
}

export function getBotTTTMove(state: TicTacToeState, difficulty: Difficulty): number {
  const emptyIndices = state.board
    .map((v, i) => (v === null ? i : -1))
    .filter((i) => i !== -1);

  if (emptyIndices.length === 0) return 0;

  const botPlayer = state.turn;
  const oppPlayer: 'X' | 'O' = botPlayer === 'X' ? 'O' : 'X';

  // 1. Can bot win?
  for (const idx of emptyIndices) {
    const test = [...state.board];
    test[idx] = botPlayer;
    if (checkTTTWin(test)) return idx;
  }

  if (difficulty === 'easy') {
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  // 2. Can opp win? Block!
  for (const idx of emptyIndices) {
    const test = [...state.board];
    test[idx] = oppPlayer;
    if (checkTTTWin(test)) return idx;
  }

  // 3. Take center if available
  if (state.board[4] === null) return 4;

  // 4. Take corners
  const corners = [0, 2, 6, 8].filter((i) => state.board[i] === null);
  if (corners.length > 0 && Math.random() < 0.8) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}
