import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { NimState, createInitialNimState, takeNimSticks, getBotNimTake, NIM_MAX_TAKE } from './nimEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';

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

  const canTake = (n: number, forPlayer: 0 | 1) =>
    !gameState.gameOver &&
    !isBotThinking &&
    n <= gameState.sticks &&
    gameState.turn === forPlayer &&
    (playMode !== 'bot' || forPlayer === 0);

  const p1Name = playMode === 'bot' ? 'Tu (P1)' : 'Giocatore 1';
  const p2Name = playMode === 'bot' ? 'BOT (P2)' : 'Giocatore 2';

  const renderTakeButtons = (forPlayer: 0 | 1, isFlipped: boolean) => (
    <div className={`flex gap-2 w-full my-2 transition-transform ${isFlipped ? 'rotate-180' : ''}`}>
      {Array.from({ length: NIM_MAX_TAKE }).map((_, i) => {
        const n = i + 1;
        const enabled = canTake(n, forPlayer);
        return (
          <button
            key={n}
            onClick={() => handleTake(n)}
            disabled={!enabled}
            className={`flex-1 py-3.5 rounded-2xl font-black text-xl transition-all shadow-md active:scale-95 ${
              enabled
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1'
                : 'bg-black/10 text-stone-400 opacity-40 cursor-not-allowed border-none'
            }`}
          >
            -{n}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto px-2 sm:px-4">
      {/* Top Player Indicator (P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#f59e0b"
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
      />

      {/* Player 2 take controls in local 1v1 */}
      {playMode === 'local_pvp' && renderTakeButtons(1, true)}

      {/* Starting sticks toggle */}
      <div className="flex items-center justify-center w-full my-1.5 px-1 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10">
          {[13, 16, 21].map((n) => (
            <button
              key={n}
              onClick={() => handleRestart(n)}
              className={`px-2.5 py-1 rounded-lg font-black transition-colors ${
                start === n ? 'bg-amber-500 text-stone-900 shadow-sm' : 'text-stone-600 dark:text-stone-300 hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Remaining sticks */}
      <div className="text-2xl font-black my-1 text-stone-900 dark:text-white">
        {gameState.sticks} <span className="text-base font-bold opacity-60">bastoncini</span>
      </div>
      <p className="text-[11px] font-black text-stone-500 dark:text-stone-400 mb-2">
        Chi prende l'ultimo bastoncino... perde!
      </p>

      {/* Board with sticks */}
      <div
        className={`w-full rounded-3xl p-4 sm:p-5 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: '#d9a66b' }}
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

      {/* Player 1 take controls */}
      {renderTakeButtons(0, false)}

      {/* Bottom Player Indicator (P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        isCurrentTurn={gameState.turn === 0 && !gameState.gameOver}
        isFlipped={false}
      />

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
