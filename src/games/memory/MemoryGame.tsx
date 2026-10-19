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
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-2">
      {/* Top Player Indicator (Rosso / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#f43f5e"
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Coppie: ${gameState.scores[1]}`}
      />

      {/* Card grid */}
      <div
        className="grid grid-cols-4 gap-2 w-full my-2 p-3 rounded-3xl shadow-xl transition-transform"
        style={{ backgroundColor: '#e8e0d0' }}
      >
        {gameState.cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(i)}
            disabled={card.matched || card.flipped || gameState.gameOver || isBotThinking}
            className={`aspect-square rounded-xl flex items-center justify-center text-3xl sm:text-4xl transition-all duration-200 shadow-sm border ${
              card.matched
                ? 'bg-emerald-500/20 border-emerald-500/40 opacity-60 scale-95'
                : card.flipped
                ? 'bg-white dark:bg-white/90 border-white/40 scale-105'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-300 hover:scale-105 cursor-pointer'
            }`}
          >
            {card.matched || card.flipped ? (
              card.emoji
            ) : (
              <span className="text-white/90 text-xl font-black">?</span>
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
