export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export interface Ghost {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  dir: Direction;
  isScared: boolean;
  isEaten: boolean;
}

// 0 = empty, 1 = wall, 2 = dot, 3 = power pellet, 4 = fruit
export const PACMAN_MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 3, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 4, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const MAZE_ROWS = PACMAN_MAZE.length;
export const MAZE_COLS = PACMAN_MAZE[0].length;

export interface PacmanState {
  maze: number[][];
  pacman: {
    x: number;
    y: number;
    dir: Direction;
    nextDir: Direction;
    mouthOpen: boolean;
  };
  ghosts: Ghost[];
  score: number;
  lives: number;
  scaredTimer: number; // remaining frames
  dotsRemaining: number;
  gameOver: boolean;
  gameWon: boolean;
  isPaused: boolean;
}

export function createInitialPacmanState(): PacmanState {
  // Count initial dots
  let dots = 0;
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      if (PACMAN_MAZE[r][c] === 2 || PACMAN_MAZE[r][c] === 3) {
        dots++;
      }
    }
  }

  return {
    maze: PACMAN_MAZE.map((row) => [...row]),
    pacman: {
      x: 9,
      y: 14,
      dir: 'LEFT',
      nextDir: 'LEFT',
      mouthOpen: true,
    },
    ghosts: [
      { id: 'blinky', name: 'Blinky', color: '#ef4444', x: 9, y: 8, dir: 'UP', isScared: false, isEaten: false },
      { id: 'pinky', name: 'Pinky', color: '#f472b6', x: 8, y: 9, dir: 'UP', isScared: false, isEaten: false },
      { id: 'inky', name: 'Inky', color: '#38bdf8', x: 10, y: 9, dir: 'UP', isScared: false, isEaten: false },
      { id: 'clyde', name: 'Clyde', color: '#fb923c', x: 9, y: 10, dir: 'UP', isScared: false, isEaten: false },
    ],
    score: 0,
    lives: 3,
    scaredTimer: 0,
    dotsRemaining: dots,
    gameOver: false,
    gameWon: false,
    isPaused: false,
  };
}

export function getNextCoord(x: number, y: number, dir: Direction): { nextX: number; nextY: number } {
  let nextX = x;
  let nextY = y;
  if (dir === 'UP') nextY--;
  else if (dir === 'DOWN') nextY++;
  else if (dir === 'LEFT') nextX--;
  else if (dir === 'RIGHT') nextX++;

  // Wrap around tunnel at row 10
  if (y === 10) {
    if (nextX < 0) nextX = MAZE_COLS - 1;
    else if (nextX >= MAZE_COLS) nextX = 0;
  }

  return { nextX, nextY };
}

export function canMove(maze: number[][], x: number, y: number, dir: Direction): boolean {
  const { nextX, nextY } = getNextCoord(x, y, dir);

  if (nextX < 0 || nextX >= MAZE_COLS || nextY < 0 || nextY >= MAZE_ROWS) {
    // only wrap row 10 is permitted
    return y === 10;
  }

  return maze[nextY][nextX] !== 1;
}
