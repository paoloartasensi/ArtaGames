import { Difficulty } from '../../types/game';

export type Stone = 'B' | 'W';
export type BoardSize = 9 | 13 | 19;

export interface GoPoint {
  r: number;
  c: number;
}

export interface GoState {
  size: BoardSize;
  board: (Stone | null)[][];
  turn: Stone;
  capturedB: number; // captured by White
  capturedW: number; // captured by Black
  passCount: number;
  gameOver: boolean;
  winner: Stone | 'draw' | null;
  scoreB?: number;
  scoreW?: number;
  lastMove: GoPoint | null;
  history: string[]; // board serializations for Ko rule
}

export function createInitialGoState(size: BoardSize = 9): GoState {
  const board: (Stone | null)[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

  return {
    size,
    board,
    turn: 'B',
    capturedB: 0,
    capturedW: 0,
    passCount: 0,
    gameOver: false,
    winner: null,
    lastMove: null,
    history: [serializeBoard(board)],
  };
}

export function serializeBoard(board: (Stone | null)[][]): string {
  return board.map((row) => row.map((cell) => cell || '.').join('')).join('');
}

export function cloneBoard(board: (Stone | null)[][]): (Stone | null)[][] {
  return board.map((row) => [...row]);
}

export function getNeighbors(r: number, c: number, size: number): GoPoint[] {
  const neighbors: GoPoint[] = [];
  if (r > 0) neighbors.push({ r: r - 1, c });
  if (r < size - 1) neighbors.push({ r: r + 1, c });
  if (c > 0) neighbors.push({ r, c: c - 1 });
  if (c < size - 1) neighbors.push({ r, c: c + 1 });
  return neighbors;
}

export function getGroupAndLiberties(
  board: (Stone | null)[][],
  startR: number,
  startC: number
): { group: GoPoint[]; liberties: Set<string> } {
  const size = board.length;
  const color = board[startR][startC];
  if (!color) return { group: [], liberties: new Set() };

  const group: GoPoint[] = [];
  const liberties = new Set<string>();
  const visited = new Set<string>();
  const queue: GoPoint[] = [{ r: startR, c: startC }];
  visited.add(`${startR},${startC}`);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    group.push(cur);

    for (const nb of getNeighbors(cur.r, cur.c, size)) {
      const nbKey = `${nb.r},${nb.c}`;
      const nbVal = board[nb.r][nb.c];

      if (nbVal === null) {
        liberties.add(nbKey);
      } else if (nbVal === color && !visited.has(nbKey)) {
        visited.add(nbKey);
        queue.push(nb);
      }
    }
  }

  return { group, liberties };
}

export function isMoveLegal(
  state: GoState,
  r: number,
  c: number,
  player: Stone
): { legal: boolean; capturedCount: number; newBoard?: (Stone | null)[][] } {
  if (r < 0 || r >= state.size || c < 0 || c >= state.size) return { legal: false, capturedCount: 0 };
  if (state.board[r][c] !== null) return { legal: false, capturedCount: 0 };

  const testBoard = cloneBoard(state.board);
  testBoard[r][c] = player;

  const opponent: Stone = player === 'B' ? 'W' : 'B';
  let capturedCount = 0;
  const stonesToRemove: GoPoint[] = [];

  // Check if this move captures any adjacent opponent groups
  for (const nb of getNeighbors(r, c, state.size)) {
    if (testBoard[nb.r][nb.c] === opponent) {
      const { group, liberties } = getGroupAndLiberties(testBoard, nb.r, nb.c);
      if (liberties.size === 0) {
        for (const stone of group) {
          if (!stonesToRemove.some((s) => s.r === stone.r && s.c === stone.c)) {
            stonesToRemove.push(stone);
          }
        }
      }
    }
  }

  for (const s of stonesToRemove) {
    testBoard[s.r][s.c] = null;
    capturedCount++;
  }

  // Check self-liberties
  const selfCheck = getGroupAndLiberties(testBoard, r, c);
  if (selfCheck.liberties.size === 0) {
    // Suicide move is illegal in standard Go
    return { legal: false, capturedCount: 0 };
  }

  // Ko rule check: new board state cannot repeat previous board state
  const serialized = serializeBoard(testBoard);
  if (state.history.length >= 2 && state.history[state.history.length - 2] === serialized) {
    return { legal: false, capturedCount: 0 };
  }

  return { legal: true, capturedCount, newBoard: testBoard };
}

export function playGoMove(state: GoState, r: number, c: number): GoState | null {
  if (state.gameOver) return null;

  const { legal, capturedCount, newBoard } = isMoveLegal(state, r, c, state.turn);
  if (!legal || !newBoard) return null;

  const nextTurn: Stone = state.turn === 'B' ? 'W' : 'B';
  const newCapturedW = state.turn === 'B' ? state.capturedW + capturedCount : state.capturedW;
  const newCapturedB = state.turn === 'W' ? state.capturedB + capturedCount : state.capturedB;

  const nextState: GoState = {
    ...state,
    board: newBoard,
    turn: nextTurn,
    capturedB: newCapturedB,
    capturedW: newCapturedW,
    passCount: 0,
    lastMove: { r, c },
    history: [...state.history, serializeBoard(newBoard)],
  };

  return nextState;
}

export function passGoTurn(state: GoState): GoState {
  if (state.gameOver) return state;

  const newPassCount = state.passCount + 1;
  const nextTurn: Stone = state.turn === 'B' ? 'W' : 'B';

  if (newPassCount >= 2) {
    // Game over: calculate territory & score
    const scores = calculateGoScore(state);
    let winner: Stone | 'draw' = 'draw';
    if (scores.scoreB > scores.scoreW) winner = 'B';
    else if (scores.scoreW > scores.scoreB) winner = 'W';

    return {
      ...state,
      turn: nextTurn,
      passCount: newPassCount,
      gameOver: true,
      winner,
      scoreB: scores.scoreB,
      scoreW: scores.scoreW,
    };
  }

  return {
    ...state,
    turn: nextTurn,
    passCount: newPassCount,
    lastMove: null,
  };
}

export function calculateGoScore(state: GoState): { scoreB: number; scoreW: number } {
  const size = state.size;
  const board = state.board;
  const visited = new Set<string>();

  let territoryB = 0;
  let territoryW = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null && !visited.has(`${r},${c}`)) {
        const territoryGroup: GoPoint[] = [];
        const borderingColors = new Set<Stone>();
        const queue: GoPoint[] = [{ r, c }];
        visited.add(`${r},${c}`);

        while (queue.length > 0) {
          const pt = queue.shift()!;
          territoryGroup.push(pt);

          for (const nb of getNeighbors(pt.r, pt.c, size)) {
            const nbColor = board[nb.r][nb.c];
            if (nbColor === null) {
              const key = `${nb.r},${nb.c}`;
              if (!visited.has(key)) {
                visited.add(key);
                queue.push(nb);
              }
            } else {
              borderingColors.add(nbColor);
            }
          }
        }

        if (borderingColors.size === 1) {
          const owner = Array.from(borderingColors)[0];
          if (owner === 'B') territoryB += territoryGroup.length;
          else territoryW += territoryGroup.length;
        }
      }
    }
  }

  // Komi: 6.5 points for White
  const komi = 6.5;
  const totalB = territoryB + state.capturedW;
  const totalW = territoryW + state.capturedB + komi;

  return { scoreB: totalB, scoreW: totalW };
}

/**
 * Smart Bot AI for Go with 4 scalable difficulty tiers
 */
export function getBotGoMove(state: GoState, difficulty: Difficulty): GoPoint | 'pass' {
  const size = state.size;
  const player = state.turn;
  const opponent: Stone = player === 'B' ? 'W' : 'B';

  const legalMoves: { pt: GoPoint; captures: number; selfLiberties: number; score: number }[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const res = isMoveLegal(state, r, c, player);
      if (res.legal && res.newBoard) {
        const { liberties: selfLib } = getGroupAndLiberties(res.newBoard, r, c);
        legalMoves.push({
          pt: { r, c },
          captures: res.capturedCount,
          selfLiberties: selfLib.size,
          score: 0,
        });
      }
    }
  }

  if (legalMoves.length === 0) return 'pass';

  if (difficulty === 'easy') {
    // 80% random, 20% immediate capture
    const captureMoves = legalMoves.filter((m) => m.captures > 0);
    if (captureMoves.length > 0 && Math.random() < 0.3) {
      return captureMoves[Math.floor(Math.random() * captureMoves.length)].pt;
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)].pt;
  }

  // Medium / Hard / Master: Evaluate tactical heuristics
  const center = (size - 1) / 2;

  legalMoves.forEach((move) => {
    let score = 0;

    // 1. Immediate capture reward
    score += move.captures * 20;

    // 2. Penalty for self-atari (1 liberty)
    if (move.selfLiberties <= 1) {
      score -= 30;
    } else {
      score += Math.min(move.selfLiberties, 4) * 3;
    }

    // 3. Proximity to adjacent existing friendly / opponent stones
    let adjacentFriendly = 0;
    let adjacentOpponent = 0;
    for (const nb of getNeighbors(move.pt.r, move.pt.c, size)) {
      if (state.board[nb.r][nb.c] === player) adjacentFriendly++;
      if (state.board[nb.r][nb.c] === opponent) adjacentOpponent++;
    }
    score += adjacentFriendly * 4;
    score += adjacentOpponent * 3;

    // 4. Center / 3rd-4th line territorial balance
    const distFromCenter = Math.abs(move.pt.r - center) + Math.abs(move.pt.c - center);
    if (difficulty === 'hard' || difficulty === 'master') {
      // Reward star points (Tengen, Hoshi)
      const isStarPoint =
        (move.pt.r === 2 || move.pt.r === size - 3 || move.pt.r === Math.floor(size / 2)) &&
        (move.pt.c === 2 || move.pt.c === size - 3 || move.pt.c === Math.floor(size / 2));
      if (isStarPoint) score += 6;

      // Avoid edge line in opening if better moves exist
      const isFirstLine = move.pt.r === 0 || move.pt.r === size - 1 || move.pt.c === 0 || move.pt.c === size - 1;
      if (isFirstLine && state.history.length < 15) {
        score -= 8;
      }

      // Check if saving any friendly group in atari
      for (const nb of getNeighbors(move.pt.r, move.pt.c, size)) {
        if (state.board[nb.r][nb.c] === player) {
          const groupInfo = getGroupAndLiberties(state.board, nb.r, nb.c);
          if (groupInfo.liberties.size === 1) {
            score += 25; // Urgent rescue
          }
        }
      }
    }

    if (difficulty === 'master') {
      // Bonus: cuts opponent or connects two separate friendly groups
      if (adjacentFriendly >= 2) score += 8;
      if (adjacentOpponent >= 2) score += 6;
      score -= distFromCenter * 0.5;
    }

    // Small randomness to prevent identical repetitive games
    score += Math.random() * 2;
    move.score = score;
  });

  legalMoves.sort((a, b) => b.score - a.score);

  if (legalMoves[0].score < -15 && state.history.length > 20) {
    return 'pass';
  }

  return legalMoves[0].pt;
}
