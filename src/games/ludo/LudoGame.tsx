import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  LudoState,
  createInitialLudoState,
  rollLudo,
  moveLudo,
  getBotLudoMove,
  TRACK,
  START_INDEX,
  HOME_COLUMNS,
  STAR_CELLS,
  FINISH_POS,
} from './ludoEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { Dices } from 'lucide-react';

interface LudoGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const CELL_TRACK = '#f5efdf';
const CELL_EMPTY = '#ece7dc';

// Base slots for the 4 tokens of each player, as [row, col] cells.
const BASE_SLOTS: [number, number][][] = [
  [[10, 10], [10, 12], [12, 10], [12, 12]], // Blu (bottom-right)
  [[1, 1], [1, 3], [3, 1], [3, 3]], // Rosso (top-left)
];

const STACK_OFFSETS = [
  { dx: -1.6, dy: -1.6 },
  { dx: 1.6, dy: -1.6 },
  { dx: -1.6, dy: 1.6 },
  { dx: 1.6, dy: 1.6 },
];

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

type CellKind = 'base0' | 'base1' | 'baseEmpty' | 'track' | 'home0' | 'home1' | 'center';

interface CellInfo {
  kind: CellKind;
  index?: number;
  star?: boolean;
  startPlayer?: 0 | 1;
}

function buildGrid(): CellInfo[][] {
  const grid: CellInfo[][] = Array.from({ length: 15 }, () =>
    Array.from({ length: 15 }, () => ({ kind: 'track' as CellKind }))
  );

  // Corner bases (6x6 each).
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      grid[r][c] = { kind: 'base1' }; // Rosso top-left
      grid[r][c + 9] = { kind: 'baseEmpty' }; // top-right (unused)
      grid[r + 9][c] = { kind: 'baseEmpty' }; // bottom-left (unused)
      grid[r + 9][c + 9] = { kind: 'base0' }; // Blu bottom-right
    }
  }

  // Centre 3x3 home area.
  for (let r = 6; r <= 8; r++) {
    for (let c = 6; c <= 8; c++) {
      grid[r][c] = { kind: 'center' };
    }
  }

  // Track cells.
  TRACK.forEach(([r, c], index) => {
    grid[r][c] = { kind: 'track', index };
  });

  // Star (safe) cells.
  STAR_CELLS.forEach((index) => {
    const [r, c] = TRACK[index];
    grid[r][c] = { ...grid[r][c], star: true };
  });

  // Start cells.
  [0, 1].forEach((p) => {
    const [r, c] = TRACK[START_INDEX[p]];
    grid[r][c] = { ...grid[r][c], startPlayer: p as 0 | 1 };
  });

  // Home columns.
  HOME_COLUMNS.forEach((cells, p) => {
    cells.forEach(([r, c]) => {
      grid[r][c] = { kind: p === 0 ? 'home0' : 'home1' };
    });
  });

  return grid;
}

const GRID = buildGrid();

function cellBackground(info: CellInfo): string {
  switch (info.kind) {
    case 'base0':
      return '#bfdbfe';
    case 'base1':
      return '#fecdd3';
    case 'baseEmpty':
      return CELL_EMPTY;
    case 'home0':
      return '#93c5fd';
    case 'home1':
      return '#fda4af';
    case 'center':
      return '#e7e0d0';
    case 'track':
    default:
      if (info.star) return '#fde68a';
      if (info.startPlayer === 0) return '#60a5fa';
      if (info.startPlayer === 1) return '#fb7185';
      return CELL_TRACK;
  }
}

const DiceFace: React.FC<{ value: number | null }> = ({ value }) => {
  const pips = value ? PIPS[value] : [];
  return (
    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/10 shadow-inner border border-black/10 dark:border-white/10 grid grid-cols-3 grid-rows-3 p-2.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {pips.includes(i) && <div className="w-2 h-2 rounded-full bg-stone-800 dark:bg-white" />}
        </div>
      ))}
    </div>
  );
};

export const LudoGame: React.FC<LudoGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<LudoState>(createInitialLudoState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Bot turn: roll first, then pick a token to move.
  useEffect(() => {
    if (playMode !== 'bot' || gameState.turn !== 1 || gameState.gameOver) return;

    setIsBotThinking(true);
    const t = setTimeout(() => {
      if (gameState.phase === 'roll') {
        const next = rollLudo(gameState);
        if (next) {
          sound.playMove();
          setGameState(next);
        }
      } else if (gameState.phase === 'move') {
        const idx = getBotLudoMove(gameState, difficulty);
        const next = moveLudo(gameState, idx);
        if (next) {
          if (next.lastMove?.captured) sound.playCapture();
          else if (next.lastMove?.finished) sound.playMove();
          else sound.playStone();
          setGameState(next);
        }
      }
      setIsBotThinking(false);
    }, 700);
    return () => clearTimeout(t);
  }, [gameState, playMode, difficulty]);

  const handleRoll = () => {
    if (gameState.gameOver || isBotThinking) return;
    if (gameState.phase !== 'roll') return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    const next = rollLudo(gameState);
    if (next) {
      sound.playMove();
      setGameState(next);
    }
  };

  const handleTokenClick = (player: 0 | 1, tokenIndex: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (gameState.phase !== 'move') return;
    if (gameState.turn !== player) return;
    if (playMode === 'bot' && player === 1) return;
    if (!gameState.movable.includes(tokenIndex)) return;
    const next = moveLudo(gameState, tokenIndex);
    if (next) {
      if (next.lastMove?.captured) sound.playCapture();
      else if (next.lastMove?.finished) sound.playMove();
      else sound.playStone();
      setGameState(next);
    }
  };

  const handleRestart = () => setGameState(createInitialLudoState());

  // --- Token positions (percent coordinates inside the square board) ---
  const rawTokens: { player: 0 | 1; tokenIndex: number; r: number; c: number }[] = [];
  (([0, 1]) as (0 | 1)[]).forEach((p) => {
    for (let i = 0; i < 4; i++) {
      const pos = gameState.tokens[p][i];
      let r: number;
      let c: number;
      if (pos === -1) {
        [r, c] = BASE_SLOTS[p][i];
      } else if (pos === FINISH_POS) {
        r = p === 0 ? 8 : 6;
        c = p === 0 ? 8 : 6;
      } else if (pos <= 50) {
        [r, c] = TRACK[(START_INDEX[p] + pos) % 52];
      } else {
        [r, c] = HOME_COLUMNS[p][pos - 51];
      }
      rawTokens.push({ player: p, tokenIndex: i, r, c });
    }
  });

  const counts = new Map<string, number>();
  rawTokens.forEach((t) => {
    const k = `${t.player}:${t.r}:${t.c}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  });
  const seen = new Map<string, number>();

  const renderedTokens = rawTokens.map((t) => {
    const k = `${t.player}:${t.r}:${t.c}`;
    let dx = 0;
    let dy = 0;
    if ((counts.get(k) || 0) > 1) {
      const order = seen.get(k) || 0;
      seen.set(k, order + 1);
      const off = STACK_OFFSETS[order % 4];
      dx = off.dx;
      dy = off.dy;
    }
    return {
      ...t,
      x: ((t.c + 0.5) / 15) * 100 + dx,
      y: ((t.r + 0.5) / 15) * 100 + dy,
      movable:
        gameState.phase === 'move' &&
        gameState.turn === t.player &&
        gameState.movable.includes(t.tokenIndex),
    };
  });

  const p1Name = 'Blu (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Rosso (BOT)' : 'Rosso (Giocatore 2)';

  const isRolling = gameState.phase === 'roll' && !gameState.gameOver;
  const canRoll = isRolling && !isBotThinking && !(playMode === 'bot' && gameState.turn === 1);

  const lastMove = gameState.lastMove;
  const statusText = gameState.gameOver
    ? ''
    : gameState.message
    ? gameState.message
    : isBotThinking
    ? 'Il BOT sta giocando...'
    : gameState.phase === 'move'
    ? playMode === 'bot' && gameState.turn === 1
      ? 'Il BOT sta scegliendo una pedina...'
      : 'Tocca una pedina illuminata per muoverla!'
    : lastMove && lastMove.extraTurn && lastMove.player === gameState.turn
    ? lastMove.captured > 0
      ? '🍽️ Mangiato! Lancia ancora il dado!'
      : '🎲 Sei uscito con un 6: lancia ancora!'
    : 'Premi "Lancia il dado" per giocare';

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-2">
      {/* Turn indicator */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 0 && !gameState.gameOver ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'opacity-70'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-xs font-semibold">{p1Name}</span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 1 && !gameState.gameOver ? 'ring-2 ring-rose-500 bg-rose-500/10' : 'opacity-70'
          }`}
        >
          <span className="text-xs font-semibold">{p2Name}</span>
          <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm" />
        </div>
      </div>

      {/* Board */}
      <div
        className={`relative w-full aspect-square rounded-3xl shadow-xl p-1.5 sm:p-2 transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: theme.boardBg }}
      >
        <div className="relative w-full h-full">
          <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] grid-rows-[repeat(15,minmax(0,1fr))] gap-px w-full h-full">
            {GRID.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className="rounded-[3px] flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: cellBackground(cell) }}
                >
                  {cell.star && (
                    <span className="text-[10px] sm:text-xs leading-none text-amber-600 font-black select-none">★</span>
                  )}
                </div>
              ))
            )}
          </div>

        {/* Tokens overlay */}
        {renderedTokens.map((t) => {
          const isBlue = t.player === 0;
          return (
            <div
              key={`${t.player}-${t.tokenIndex}`}
              onClick={() => handleTokenClick(t.player, t.tokenIndex)}
              className={`absolute rounded-full shadow transition-all ${
                t.movable ? 'cursor-pointer ring-2 ring-emerald-400 ring-offset-1 animate-pulse' : ''
              }`}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: '5.6%',
                height: '5.6%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: isBlue ? '#3b82f6' : '#f43f5e',
                border: '2px solid white',
              }}
            />
          );
        })}
        </div>
      </div>

      {/* Dice + roll button */}
      <div className="mt-4 flex items-center gap-4">
        <DiceFace value={gameState.dice} />
        <button
          onClick={handleRoll}
          disabled={!canRoll}
          className="px-6 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-lg shadow-lg shadow-amber-600/20 transition-transform active:scale-95 disabled:opacity-40 flex items-center gap-2"
        >
          <Dices className="w-6 h-6" />
          <span>Lancia il dado</span>
        </button>
      </div>

      <p className="mt-3 text-[11px] text-center font-medium text-stone-500 dark:text-stone-400 max-w-xs min-h-[2.5rem]">
        {statusText}
      </p>

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={gameState.winner === 0 ? 'Vince il Blu! 🎉' : 'Vince il Rosso! 🎉'}
        winnerSubtitle={
          gameState.winner === 0
            ? playMode === 'bot'
              ? 'Bravissimo! Hai portato a casa tutte le pedine!'
              : 'Complimenti al Giocatore 1, tutte le pedine a casa!'
            : playMode === 'bot'
            ? 'Il BOT ha portato a casa tutte le pedine. Rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
