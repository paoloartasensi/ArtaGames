import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import {
  TetrisState,
  createInitialTetrisState,
  checkCollision,
  rotateMatrix,
  getGhostY,
  getRandomTetromino,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  createEmptyGrid,
} from './tetrisEngine';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  RotateCw,
  ChevronsDown,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface TetrisGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const TetrisGame: React.FC<TetrisGameProps> = ({
  onSelectGame,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<TetrisState>(createInitialTetrisState);
  const requestRef = useRef<number | null>(null);
  const lastDropTimeRef = useRef<number>(Date.now());

  // Drop interval speed based on level
  const dropInterval = Math.max(120, 750 - (gameState.level - 1) * 60);

  // Lock piece into grid & clear full rows
  const lockPieceAndClear = useCallback((state: TetrisState): TetrisState => {
    const newGrid = state.grid.map((row) => [...row]);
    const { shape, color } = state.currentPiece;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const y = state.currentY + r;
          const x = state.currentX + c;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            newGrid[y][x] = color;
          }
        }
      }
    }

    // Check full lines
    let clearedCount = 0;
    const filteredGrid = newGrid.filter((row) => {
      const isFull = row.every((cell) => cell !== null);
      if (isFull) clearedCount++;
      return !isFull;
    });

    while (filteredGrid.length < BOARD_HEIGHT) {
      filteredGrid.unshift(Array(BOARD_WIDTH).fill(null));
    }

    if (clearedCount > 0) {
      sound.playCapture();
    } else {
      sound.playStone();
    }

    // Score calculation
    const points =
      clearedCount === 1
        ? 100 * state.level
        : clearedCount === 2
        ? 300 * state.level
        : clearedCount === 3
        ? 500 * state.level
        : clearedCount >= 4
        ? 800 * state.level
        : 0;

    const newLines = state.lines + clearedCount;
    const newLevel = Math.floor(newLines / 10) + 1;
    const nextPiece = state.nextPiece;
    const newNext = getRandomTetromino();

    const startX = Math.floor((BOARD_WIDTH - nextPiece.shape[0].length) / 2);
    const startY = 0;

    // Check Game Over (spawn collision)
    if (checkCollision(filteredGrid, nextPiece, startX, startY)) {
      sound.playMiss();
      return {
        ...state,
        grid: filteredGrid,
        score: state.score + points,
        lines: newLines,
        level: newLevel,
        gameOver: true,
      };
    }

    return {
      ...state,
      grid: filteredGrid,
      currentPiece: nextPiece,
      currentX: startX,
      currentY: startY,
      nextPiece: newNext,
      score: state.score + points,
      lines: newLines,
      level: newLevel,
    };
  }, []);

  // Move left
  const moveLeft = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || prev.isPaused) return prev;
      if (!checkCollision(prev.grid, prev.currentPiece, prev.currentX - 1, prev.currentY)) {
        sound.playTick();
        return { ...prev, currentX: prev.currentX - 1 };
      }
      return prev;
    });
  }, []);

  // Move right
  const moveRight = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || prev.isPaused) return prev;
      if (!checkCollision(prev.grid, prev.currentPiece, prev.currentX + 1, prev.currentY)) {
        sound.playTick();
        return { ...prev, currentX: prev.currentX + 1 };
      }
      return prev;
    });
  }, []);

  // Rotate
  const rotatePiece = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || prev.isPaused) return prev;
      const rotatedShape = rotateMatrix(prev.currentPiece.shape);
      const rotatedPiece = { ...prev.currentPiece, shape: rotatedShape };

      // Wall kick test (0, -1, +1, -2, +2)
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!checkCollision(prev.grid, rotatedPiece, prev.currentX + kick, prev.currentY)) {
          sound.playMove();
          return {
            ...prev,
            currentPiece: rotatedPiece,
            currentX: prev.currentX + kick,
          };
        }
      }
      return prev;
    });
  }, []);

  // Soft drop
  const dropOne = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || prev.isPaused) return prev;
      if (!checkCollision(prev.grid, prev.currentPiece, prev.currentX, prev.currentY + 1)) {
        return { ...prev, currentY: prev.currentY + 1 };
      } else {
        return lockPieceAndClear(prev);
      }
    });
    lastDropTimeRef.current = Date.now();
  }, [lockPieceAndClear]);

  // Hard drop
  const hardDrop = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || prev.isPaused) return prev;
      const ghostY = getGhostY(prev.grid, prev.currentPiece, prev.currentX, prev.currentY);
      sound.playHit();
      const droppedState = { ...prev, currentY: ghostY };
      return lockPieceAndClear(droppedState);
    });
    lastDropTimeRef.current = Date.now();
  }, [lockPieceAndClear]);

  // Game loop for automatic gravity drop
  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      if (!gameState.gameOver && !gameState.isPaused) {
        if (now - lastDropTimeRef.current >= dropInterval) {
          dropOne();
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [dropInterval, dropOne, gameState.gameOver, gameState.isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameOver) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveRight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        rotatePiece();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        dropOne();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        hardDrop();
      } else if (e.key === 'p' || e.key === 'P') {
        setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropOne, hardDrop, moveLeft, moveRight, rotatePiece, gameState.gameOver]);

  const handleRestart = () => {
    sound.playTick();
    setGameState(createInitialTetrisState());
    lastDropTimeRef.current = Date.now();
  };

  // Build rendered display matrix combining locked blocks, ghost, and active falling piece
  const displayGrid = gameState.grid.map((row) => [...row]);
  const ghostY = getGhostY(
    gameState.grid,
    gameState.currentPiece,
    gameState.currentX,
    gameState.currentY
  );

  // Ghost projection
  if (!gameState.gameOver) {
    const { shape } = gameState.currentPiece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const y = ghostY + r;
          const x = gameState.currentX + c;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            if (!displayGrid[y][x]) {
              displayGrid[y][x] = 'ghost';
            }
          }
        }
      }
    }

    // Active piece
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const y = gameState.currentY + r;
          const x = gameState.currentX + c;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            displayGrid[y][x] = gameState.currentPiece.color;
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-5xl md:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 flex-1 h-full min-h-0 select-none">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-black/40 border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧱</span>
          <span className="text-base sm:text-lg font-black text-cyan-400 tracking-wider">
            TETRIS CLASSICO
          </span>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold text-white">
            <span className="text-stone-400">Punti:</span>
            <span className="text-amber-400 font-black">{gameState.score}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold text-white">
            <span className="text-stone-400">Livello:</span>
            <span className="text-emerald-400 font-black">{gameState.level}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold text-white">
            <span className="text-stone-400">Righe:</span>
            <span className="text-cyan-400 font-black">{gameState.lines}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-sm"
            title={gameState.isPaused ? 'Riprendi' : 'Pausa'}
          >
            {gameState.isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-sm"
            title="Ricomincia"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Playing Field & Side Panel */}
      <div className="w-full flex-1 flex items-center justify-center gap-4 sm:gap-8 my-auto min-h-0 py-2">
        {/* Next Piece Card (Left on Desktop, or inline) */}
        <div className="hidden sm:flex flex-col items-center gap-2 p-4 rounded-3xl bg-black/40 border border-white/10 shadow-xl w-32">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            PROSSIMO
          </span>
          <div className="grid grid-cols-4 grid-rows-4 gap-1 w-20 h-20 p-2 bg-stone-950/80 rounded-2xl border border-white/5 items-center justify-center">
            {Array.from({ length: 4 }).map((_, r) =>
              Array.from({ length: 4 }).map((_, c) => {
                const isBlock =
                  r < gameState.nextPiece.shape.length &&
                  c < gameState.nextPiece.shape[r].length &&
                  gameState.nextPiece.shape[r][c];

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-full aspect-square rounded-sm ${
                      isBlock ? 'shadow-sm' : 'opacity-0'
                    }`}
                    style={{
                      backgroundColor: isBlock ? gameState.nextPiece.color : 'transparent',
                    }}
                  />
                );
              })
            )}
          </div>
          <span className="text-[10px] text-stone-400 font-semibold mt-2 text-center">
            Spazio = Caduta Rapida
          </span>
        </div>

        {/* 10x20 Tetris Matrix */}
        <div
          className="relative aspect-[10/20] h-full max-h-[70vh] rounded-3xl p-2.5 sm:p-3 shadow-2xl border-4 border-stone-700 flex flex-col justify-between"
          style={{ backgroundColor: '#090d16' }}
        >
          {/* Grid Blocks */}
          <div className="grid grid-cols-10 grid-rows-20 gap-0.5 sm:gap-1 w-full h-full bg-black/60 rounded-2xl p-1 overflow-hidden">
            {displayGrid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-full h-full rounded-sm transition-colors ${
                    cell === 'ghost'
                      ? 'border border-cyan-400/40 bg-cyan-500/10'
                      : cell
                      ? 'shadow-inner border border-white/20'
                      : 'bg-stone-900/30'
                  }`}
                  style={{
                    backgroundColor: cell && cell !== 'ghost' ? cell : undefined,
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Instructions / Next Piece on mobile */}
        <div className="flex sm:hidden flex-col items-center gap-1.5 p-2 rounded-2xl bg-black/40 border border-white/10 shadow-lg w-20">
          <span className="text-[9px] font-bold text-stone-400">PROSSIMO</span>
          <div className="grid grid-cols-4 gap-0.5 w-12 h-12 bg-stone-950 rounded-xl p-1">
            {Array.from({ length: 4 }).map((_, r) =>
              Array.from({ length: 4 }).map((_, c) => {
                const isBlock =
                  r < gameState.nextPiece.shape.length &&
                  c < gameState.nextPiece.shape[r].length &&
                  gameState.nextPiece.shape[r][c];

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-full aspect-square rounded-[2px] ${
                      isBlock ? 'shadow-sm' : 'opacity-0'
                    }`}
                    style={{
                      backgroundColor: isBlock ? gameState.nextPiece.color : 'transparent',
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Large Tactile Touch Gamepad Controls for iPad & Mobile */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between gap-2 sm:gap-3 py-2 px-3 bg-black/50 border border-white/10 rounded-3xl shadow-2xl">
        {/* Left / Right / Rotate */}
        <div className="flex items-center gap-2">
          <button
            onClick={moveLeft}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white flex items-center justify-center shadow-lg border border-white/10"
            title="Sinistra"
          >
            <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          <button
            onClick={moveRight}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white flex items-center justify-center shadow-lg border border-white/10"
            title="Destra"
          >
            <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>

        {/* Rotate Button (Center/Action) */}
        <button
          onClick={rotatePiece}
          className="w-14 h-14 sm:w-18 sm:h-18 rounded-3xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black flex flex-col items-center justify-center shadow-xl border-2 border-amber-300"
          title="Ruota"
        >
          <RotateCw className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-[10px] uppercase tracking-wider font-black">Ruota</span>
        </button>

        {/* Soft Drop & Hard Drop */}
        <div className="flex items-center gap-2">
          <button
            onClick={dropOne}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center shadow-lg border border-blue-400"
            title="Giù"
          >
            <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          <button
            onClick={hardDrop}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg border border-rose-400"
            title="Caduta Rapida (Hard Drop)"
          >
            <ChevronsDown className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle="Partita Finita! 🧱"
        winnerSubtitle={`Complimenti! Hai totalizzato ${gameState.score} punti e completato ${gameState.lines} righe! Pronto per la rivincita?`}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
