import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { NimState, createInitialNimState, takeNimSticks, getBotNimTake, NIM_MAX_TAKE } from './nimEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface NimGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const NimGame: React.FC<NimGameProps> = ({ playMode, difficulty, onSelectGame, isTabletFlipped }) => {
  const { theme } = useTheme();
  const [start, setStart] = useState<number>(16);
  const [gameState, setGameState] = useState<NimState>(() => createInitialNimState(16));
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT turn
  useEffect(() => {
    if (playMode !== 'bot' || gameState.gameOver) return;
    if (gameState.turn !== 1) return;
    setIsBotThinking(true);
    const t = setTimeout(() => {
      const n = getBotNimTake(gameState, difficulty);
      const next = takeNimSticks(gameState, n);
      if (next) {
        sound.playCapture();
        setGameState(next);
      }
      setIsBotThinking(false);
    }, 650);
    return () => clearTimeout(t);
  }, [gameState, playMode, difficulty]);

  const handleTake = (n: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    const next = takeNimSticks(gameState, n);
    if (next) {
      sound.playCapture();
      setGameState(next);
    }
  };

  const handleRestart = (newStart?: number) => {
    const s = newStart ?? start;
    if (newStart) setStart(newStart);
    setGameState(createInitialNimState(s));
  };

  const canTake = (n: number) =>
    !gameState.gameOver && !isBotThinking && n <= gameState.sticks && (playMode !== 'bot' || gameState.turn === 0);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-2">
      {/* Starting sticks toggle */}
      <div className="flex items-center justify-center w-full mb-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10">
          {[13, 16, 21].map((n) => (
            <button
              key={n}
              onClick={() => handleRestart(n)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                start === n ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Turn bar */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 0 && !gameState.gameOver ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'opacity-70'
          }`}
        >
          <span className="text-xs font-semibold">{playMode === 'bot' ? 'Tu' : 'Giocatore 1'}</span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 1 && !gameState.gameOver ? 'ring-2 ring-amber-500 bg-amber-500/10' : 'opacity-70'
          }`}
        >
          <span className="text-xs font-semibold">{playMode === 'bot' ? 'BOT' : 'Giocatore 2'}</span>
        </div>
      </div>

      {/* Remaining sticks */}
      <div className="text-2xl font-extrabold mb-1">
        {gameState.sticks} <span className="text-base font-semibold opacity-60">bastoncini</span>
      </div>
      <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-3">
        Chi prende l'ultimo bastoncino... perde!
      </p>

      {/* Board with sticks */}
      <div
        className={`w-full rounded-3xl p-4 sm:p-5 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: gameState.gameOver ? theme.boardBg : getTurnColor(gameState.turn, playMode) }}
      >
        <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-3 min-h-[120px] rounded-2xl bg-black/15 p-4">
          {gameState.sticks === 0 ? (
            <span className="text-sm font-semibold opacity-60 self-center">Nessun bastoncino rimasto!</span>
          ) : (
            Array.from({ length: gameState.sticks }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-14 sm:h-16 rounded-full bg-gradient-to-b from-[#d4a373] to-[#a9742e] ring-1 ring-black/30 shadow"
                style={{ transform: `rotate(${(i % 3) * 2 - 2}deg)` }}
              />
            ))
          )}
        </div>
      </div>

      {/* Take buttons */}
      <div className="flex gap-2 mt-4 w-full">
        {Array.from({ length: NIM_MAX_TAKE }).map((_, i) => {
          const n = i + 1;
          const enabled = canTake(n);
          return (
            <button
              key={n}
              onClick={() => handleTake(n)}
              disabled={!enabled}
              className={`flex-1 py-3 rounded-xl font-bold text-lg transition-transform ${
                enabled
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-900 active:scale-95 shadow-lg shadow-amber-500/20'
                  : 'bg-black/10 text-stone-400 cursor-not-allowed'
              }`}
            >
              -{n}
            </button>
          );
        })}
      </div>

      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse">Il BOT sta togliendo i bastoncini...</div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 0
            ? playMode === 'bot'
              ? 'Hai vinto! 🎉'
              : 'Vince il Giocatore 1! 🎉'
            : playMode === 'bot'
            ? 'Vince il BOT! 🎉'
            : 'Vince il Giocatore 2! 🎉'
        }
        winnerSubtitle="Chi ha preso l'ultimo bastoncino ha perso la partita!"
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
