import React, { useEffect, useRef, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  MemoryState,
  createInitialMemoryState,
  flipMemoryCard,
  resetMemoryMismatch,
  pickBotFirstCard,
  pickBotSecondCard,
} from './memoryEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';

interface MemoryGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ playMode, difficulty, onSelectGame }) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<MemoryState>(createInitialMemoryState());
  const [isBotThinking, setIsBotThinking] = useState(false);
  const memoryRef = useRef<Record<number, string>>({});

  // Record any revealed card so the BOT can "remember" it.
  useEffect(() => {
    gameState.cards.forEach((c, i) => {
      if (c.flipped && !c.matched) memoryRef.current[i] = c.emoji;
    });
  }, [gameState]);

  // Flip non-matching cards back down after a short delay.
  useEffect(() => {
    if (gameState.mismatchPair) {
      const t = setTimeout(() => {
        setGameState((s) => resetMemoryMismatch(s) ?? s);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [gameState.mismatchPair]);

  // BOT turn: reveal two cards with a pause between them.
  useEffect(() => {
    if (playMode !== 'bot' || gameState.turn !== 1 || gameState.gameOver) return;
    if (gameState.mismatchPair) return;
    setIsBotThinking(true);

    let cancelled = false;
    const first = pickBotFirstCard(gameState, memoryRef.current, difficulty);
    if (first < 0) {
      setIsBotThinking(false);
      return;
    }

    const t0 = setTimeout(() => {
      if (cancelled) return;
      const s1 = flipMemoryCard(gameState, first);
      if (!s1) {
        setIsBotThinking(false);
        return;
      }
      sound.playTick();
      setGameState(s1);

      const t1 = setTimeout(() => {
        if (cancelled) return;
        const second = pickBotSecondCard(s1, memoryRef.current, first, difficulty);
        if (second < 0) {
          setIsBotThinking(false);
          return;
        }
        const s2 = flipMemoryCard(s1, second);
        if (s2) {
          if (s2.mismatchPair) sound.playMiss();
          else sound.playCapture();
          setGameState(s2);
        }
        setIsBotThinking(false);
      }, 700);
      return () => clearTimeout(t1);
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(t0);
      setIsBotThinking(false);
    };
  }, [gameState, playMode, difficulty]);

  const handleCardClick = (i: number) => {
    if (gameState.gameOver || isBotThinking || gameState.mismatchPair) return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    const next = flipMemoryCard(gameState, i);
    if (next) {
      sound.playTick();
      setGameState(next);
    }
  };

  const handleRestart = () => {
    memoryRef.current = {};
    setGameState(createInitialMemoryState());
  };

  const p1Name = 'Blu (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Rosso (BOT)' : 'Rosso (Giocatore 2)';

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-5xl md:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 flex-1 h-full min-h-0">
      {/* Top Player Indicator (Rosso / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#f43f5e"
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Coppie: ${gameState.scores[1]}`}
      />

      {/* Card grid - Fills widescreen landscape with 8 columns x 2 rows, or portrait with 4 columns x 4 rows */}
      <div
        className="grid grid-cols-4 landscape:grid-cols-8 md:landscape:grid-cols-8 gap-2.5 sm:gap-4 md:gap-5 w-full my-auto p-3 sm:p-5 md:p-6 rounded-3xl shadow-xl transition-all"
        style={{ backgroundColor: '#e8e0d0' }}
      >
        {gameState.cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(i)}
            disabled={card.matched || card.flipped || gameState.gameOver || isBotThinking}
            className={`aspect-square sm:aspect-[4/5] md:aspect-square rounded-2xl sm:rounded-3xl flex items-center justify-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl transition-all duration-200 shadow-lg border-2 ${
              card.matched
                ? 'bg-emerald-500/25 border-emerald-500/50 opacity-60 scale-95'
                : card.flipped
                ? 'bg-white dark:bg-white/95 border-white/60 scale-105 shadow-xl'
                : 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 border-indigo-300 hover:scale-105 active:scale-95 cursor-pointer shadow-indigo-900/30'
            }`}
          >
            {card.matched || card.flipped ? (
              <span className="filter drop-shadow-sm transform hover:scale-110 transition-transform">
                {card.emoji}
              </span>
            ) : (
              <span className="text-white/90 text-3xl sm:text-5xl md:text-6xl font-black select-none">?</span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom Player Indicator (Blu / P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        isCurrentTurn={gameState.turn === 0 && !gameState.gameOver}
        isFlipped={false}
        score={`Coppie: ${gameState.scores[0]}`}
      />

      {isBotThinking && (
        <div className="mt-2 text-xs font-medium text-amber-500 animate-pulse">
          Il BOT sta cercando le coppie...
        </div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Pareggio Amichevole!'
            : gameState.winner === 0
            ? 'Vince il Blu! 🎉'
            : 'Vince il Rosso! 🎉'
        }
        winnerSubtitle={
          gameState.winner === 'draw'
            ? 'Avete trovato lo stesso numero di coppie!'
            : gameState.winner === 0
            ? playMode === 'bot'
              ? 'Memoria di ferro! Hai battuto il BOT!'
              : 'Complimenti al Giocatore 1!'
            : playMode === 'bot'
            ? 'Il BOT ha trovato più coppie. Rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        isDraw={gameState.winner === 'draw'}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
