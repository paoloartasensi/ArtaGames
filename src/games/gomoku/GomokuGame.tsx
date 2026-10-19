import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  GomokuState,
  createInitialGomokuState,
  playGomokuMove,
  getBotGomokuMove,
} from './gomokuEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface GomokuGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const GomokuGame: React.FC<GomokuGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [boardSize, setBoardSize] = useState<number>(9);
  const [gameState, setGameState] = useState<GomokuState>(() => createInitialGomokuState(9));
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT turn
  useEffect(() => {
    if (playMode !== 'bot' || gameState.gameOver) return;
    if (gameState.turn !== 1) return;
    setIsBotThinking(true);
    const t = setTimeout(() => {
      const { r, c } = getBotGomokuMove(gameState, difficulty);
      const next = playGomokuMove(gameState, r, c);
      if (next) {
        sound.playStone();
        setGameState(next);
      }
      setIsBotThinking(false);
    }, 550);
    return () => clearTimeout(t);
  }, [gameState, playMode, difficulty]);

  const handleClick = (r: number, c: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    const next = playGomokuMove(gameState, r, c);
    if (next) {
      sound.playStone();
      setGameState(next);
    }
  };

  const handleRestart = (newSize?: number) => {
    const s = newSize ?? boardSize;
    if (newSize) setBoardSize(newSize);
    setGameState(createInitialGomokuState(s));
  };

  const isWinCell = (r: number, c: number) =>
    gameState.winningLine?.some((p) => p.r === r && p.c === c) ?? false;

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-2">
      {/* Board size toggle */}
      <div className="flex items-center justify-center w-full mb-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10">
          {[9, 11, 15].map((n) => (
            <button
              key={n}
              onClick={() => handleRestart(n)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                boardSize === n ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {n}×{n}
            </button>
          ))}
        </div>
      </div>

      {/* Turn bar */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 0 && !gameState.gameOver ? 'ring-2 ring-stone-400 bg-white/10' : 'opacity-70'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-stone-500 to-stone-900 ring-1 ring-black/40" />
          <span className="text-xs font-semibold">{playMode === 'bot' ? 'Tu (Nero)' : 'Nero'}</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 1 && !gameState.gameOver ? 'ring-2 ring-slate-300 bg-white/10' : 'opacity-70'
          }`}
        >
          <span className="text-xs font-semibold">{playMode === 'bot' ? 'BOT (Bianco)' : 'Bianco'}</span>
          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-white to-stone-300 ring-1 ring-black/20" />
        </div>
      </div>

      {/* 9x9 board */}
      <div
        className={`w-full aspect-square rounded-3xl p-2 sm:p-3 shadow-xl transition-transform ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{ backgroundColor: '#e0b069' }}
      >
        <div className="grid w-full h-full rounded-xl p-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${gameState.size}, 1fr)`, backgroundColor: theme.boardGrid }}>
          {gameState.board.map((row, r) =>
            row.map((cell, c) => {
              const win = isWinCell(r, c);
              const empty = cell === null;
              const playable = empty && !gameState.gameOver && !isBotThinking && (playMode !== 'bot' || gameState.turn === 0);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  disabled={!playable}
                  className={`flex items-center justify-center aspect-square rounded-[6px] transition-colors ${
                    playable ? 'hover:bg-white/20 cursor-pointer active:scale-95' : ''
                  }`}
                  style={{ backgroundColor: '#e0b069' }}
                >
                  {cell !== null && (
                    <span
                      className={`block rounded-full w-[74%] h-[74%] shadow-md ${
                        cell === 0
                          ? 'bg-gradient-to-br from-stone-500 to-stone-900 ring-1 ring-black/50'
                          : 'bg-gradient-to-br from-white to-stone-300 ring-1 ring-black/30'
                      } ${win ? 'ring-4 ring-amber-400 animate-pulse' : ''}`}
                    />
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse">Il BOT sta piazzando la pietra...</div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Pareggio!'
            : gameState.winner === 0
            ? playMode === 'bot'
              ? 'Hai vinto! 🌟 (Nero)'
              : 'Vince il Nero! 🌟'
            : playMode === 'bot'
            ? 'Vince il BOT! (Bianco)'
            : 'Vince il Bianco! 🌟'
        }
        winnerSubtitle={
          gameState.winner === 'draw'
            ? 'La griglia è piena senza 5 in fila!'
            : 'Cinque pietre in fila: che colpo!'
        }
        isDraw={gameState.winner === 'draw'}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
