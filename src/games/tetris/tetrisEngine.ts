export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  color: string;
}

export const TETROMINOES: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#06b6d4', // cyan
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#3b82f6', // blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f97316', // orange
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#eab308', // yellow
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#22c55e', // green
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a855f7', // purple
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ef4444', // red
  },
};

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export interface TetrisState {
  grid: (string | null)[][]; // 20 rows x 10 cols of color hex or null
  currentPiece: Tetromino;
  currentX: number;
  currentY: number;
  nextPiece: Tetromino;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
}

const TYPES: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export function getRandomTetromino(): Tetromino {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  return {
    type,
    shape: TETROMINOES[type].shape.map((row) => [...row]),
    color: TETROMINOES[type].color,
  };
}

export function createEmptyGrid(): (string | null)[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

export function createInitialTetrisState(): TetrisState {
  const firstPiece = getRandomTetromino();
  const next = getRandomTetromino();

  return {
    grid: createEmptyGrid(),
    currentPiece: firstPiece,
    currentX: Math.floor((BOARD_WIDTH - firstPiece.shape[0].length) / 2),
    currentY: 0,
    nextPiece: next,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    isPaused: false,
  };
}

export function checkCollision(
  grid: (string | null)[][],
  piece: Tetromino,
  offsetX: number,
  offsetY: number
): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const x = offsetX + c;
        const y = offsetY + r;

        // Check bounds
        if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
          return true;
        }

        // Check other blocks
        if (y >= 0 && grid[y][x] !== null) {
          return true;
        }
      }
    }
  }
  return false;
}

export function rotateMatrix(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return rotated;
}

export function getGhostY(grid: (string | null)[][], piece: Tetromino, x: number, startY: number): number {
  let y = startY;
  while (!checkCollision(grid, piece, x, y + 1)) {
    y++;
  }
  return y;
}
