import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  MancalaState,
  createInitialMancalaState,
  sowMancala,
  getBotMancalaMove,
} from './mancalaEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';

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
    if (playMode === 'bot' && gameState.turn === 1 && !gameState.gameOver) {
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
  }, [gameState, playMode, difficulty]);

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

  const renderPit = (pit: number, clickable: boolean, isP2Pit: boolean = false) => {
    const count = gameState.pits[pit];
    const shouldFlip = isP2Pit && playMode === 'local_pvp';
    return (
      <button
        key={pit}
        onClick={() => handlePitClick(pit)}
        disabled={!clickable || count === 0}
        className={`aspect-[4/3] rounded-full flex items-center justify-center text-base sm:text-xl font-black transition-all shadow-inner ${
          clickable && count > 0
            ? 'ring-2 ring-amber-400 bg-gradient-to-b from-[#7a4a20] to-[#3a2410] text-[#f5d9a0] hover:scale-105 cursor-pointer'
            : 'bg-gradient-to-b from-[#7a4a20] to-[#3a2410] text-[#d9b98a]'
        }`}
      >
        <span className={shouldFlip ? 'rotate-180 transition-transform' : ''}>
          {count > 0 ? count : ''}
        </span>
      </button>
    );
  };

  const p1Name = 'Blu (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Rosso (BOT)' : 'Rosso (Giocatore 2)';

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      {/* Top Player Indicator (Rosso / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#f43f5e"
        isCurrentTurn={!isP1Turn && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Riserva: ${gameState.pits[13]}`}
      />

      {/* Board */}
      <div
        className={`w-full rounded-3xl p-3 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: '#d9a66b' }}
      >
        <div className="flex items-center gap-2">
          {/* P2 store (left) */}
          <div className="w-12 sm:w-16 self-stretch rounded-full bg-gradient-to-b from-[#7a4a20] to-[#3a2410] border-2 border-[#5a3a18] shadow-inner flex flex-col items-center justify-center text-xl sm:text-2xl font-black text-[#f5d9a0]">
            <span className="text-[10px] font-semibold text-[#d9b98a]">Rosso</span>
            {gameState.pits[13]}
          </div>

          <div className="flex-1 grid gap-2">
            {/* Top row (P2 pits 7..12) */}
            <div className="grid grid-cols-6 gap-2">
              {P2_PITS.map((p) => renderPit(p, clickableP2, true))}
            </div>
            {/* Bottom row (P1 pits 0..5) */}
            <div className="grid grid-cols-6 gap-2">
              {P1_PITS.map((p) => renderPit(p, clickableP1, false))}
            </div>
          </div>

          {/* P1 store (right) */}
          <div className="w-12 sm:w-16 self-stretch rounded-full bg-gradient-to-b from-[#7a4a20] to-[#3a2410] border-2 border-[#5a3a18] shadow-inner flex flex-col items-center justify-center text-xl sm:text-2xl font-black text-[#f5d9a0]">
            <span className="text-[10px] font-semibold text-[#d9b98a]">Blu</span>
            {gameState.pits[6]}
          </div>
        </div>
      </div>

      {/* Bottom Player Indicator (Blu / P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        isCurrentTurn={isP1Turn && !gameState.gameOver}
        isFlipped={false}
        score={`Riserva: ${gameState.pits[6]}`}
      />

      <p className="mt-2 text-[11px] text-center font-medium text-stone-500 dark:text-stone-400 max-w-xs">
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
