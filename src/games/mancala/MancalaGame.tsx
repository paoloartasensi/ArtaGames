import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  MancalaState,
  createInitialMancalaState,
  sowMancala,
  getBotMancalaMove,
} from './mancalaEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface MancalaGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const P1_PITS = [0, 1, 2, 3, 4, 5];
const P2_PITS = [7, 8, 9, 10, 11, 12];

export const MancalaGame: React.FC<MancalaGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<MancalaState>(createInitialMancalaState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 1 && !gameState.gameOver && !isBotThinking) {
      setIsBotThinking(true);
      const t = setTimeout(() => {
        const pit = getBotMancalaMove(gameState, difficulty);
        const next = sowMancala(gameState, pit);
        if (next) {
          if (next.lastSow?.captured) sound.playCapture();
          else sound.playStone();
          setGameState(next);
        }
        setIsBotThinking(false);
      }, 650);
      return () => clearTimeout(t);
    }
  }, [gameState, playMode, difficulty, isBotThinking]);

  const handlePitClick = (pit: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    const next = sowMancala(gameState, pit);
    if (next) {
      if (next.lastSow?.captured) sound.playCapture();
      else sound.playStone();
      setGameState(next);
    }
  };

  const handleRestart = () => setGameState(createInitialMancalaState());

  const isP1Turn = gameState.turn === 0;
  const clickableP1 = !gameState.gameOver && isP1Turn && !isBotThinking;
  const clickableP2 = !gameState.gameOver && !isP1Turn && playMode === 'local_pvp' && !isBotThinking;

  const renderPit = (pit: number, clickable: boolean) => {
    const count = gameState.pits[pit];
    return (
      <button
        key={pit}
        onClick={() => handlePitClick(pit)}
        disabled={!clickable || count === 0}
        className={`aspect-square rounded-2xl flex items-center justify-center text-lg sm:text-2xl font-black transition-all border-2 shadow-inner ${
          clickable && count > 0
            ? 'border-amber-400 bg-white/20 dark:bg-white/10 hover:scale-105 cursor-pointer'
            : 'border-black/10 dark:border-white/10 bg-black/10 dark:bg-white/5'
        }`}
      >
        {count > 0 ? count : ''}
      </button>
    );
  };

  const p1Name = 'Blu (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Rosso (BOT)' : 'Rosso (Giocatore 2)';

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      {/* Turn indicator */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            isP1Turn && !gameState.gameOver ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'opacity-70'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-xs font-semibold">{p1Name}</span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            !isP1Turn && !gameState.gameOver ? 'ring-2 ring-rose-500 bg-rose-500/10' : 'opacity-70'
          }`}
        >
          <span className="text-xs font-semibold">{p2Name}</span>
          <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm" />
        </div>
      </div>

      {/* Board */}
      <div
        className={`w-full rounded-3xl p-3 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: theme.boardBg }}
      >
        <div className="flex items-center gap-2">
          {/* P2 store (left) */}
          <div className="w-12 sm:w-16 self-stretch rounded-2xl bg-black/10 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 flex flex-col items-center justify-center text-xl sm:text-2xl font-black">
            <span className="text-[10px] font-semibold text-stone-500">Rosso</span>
            {gameState.pits[13]}
          </div>

          <div className="flex-1 grid gap-2">
            {/* Top row (P2 pits 7..12) */}
            <div className="grid grid-cols-6 gap-2">
              {P2_PITS.map((p) => renderPit(p, clickableP2))}
            </div>
            {/* Bottom row (P1 pits 0..5) */}
            <div className="grid grid-cols-6 gap-2">
              {P1_PITS.map((p) => renderPit(p, clickableP1))}
            </div>
          </div>

          {/* P1 store (right) */}
          <div className="w-12 sm:w-16 self-stretch rounded-2xl bg-black/10 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 flex flex-col items-center justify-center text-xl sm:text-2xl font-black">
            <span className="text-[10px] font-semibold text-stone-500">Blu</span>
            {gameState.pits[6]}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-center font-medium text-stone-500 dark:text-stone-400 max-w-xs">
        Tocca una delle tue 6 buche per seminare i semi in senso antiorario. Se l'ultimo seme cade nella tua riserva, giochi di nuovo!
      </p>

      {isBotThinking && (
        <div className="mt-2 text-xs font-medium text-amber-500 animate-pulse">Il BOT sta seminando...</div>
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
            ? 'Stesso numero di semi nella riserva!'
            : gameState.winner === 0
            ? playMode === 'bot'
              ? 'Hai raccolto più semi del BOT!'
              : 'Complimenti al Giocatore 1!'
            : playMode === 'bot'
            ? 'Il BOT ha raccolto più semi. Rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        isDraw={gameState.winner === 'draw'}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
