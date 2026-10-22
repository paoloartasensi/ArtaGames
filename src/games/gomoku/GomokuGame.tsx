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
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';

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

  const p1Name = playMode === 'bot' ? 'Tu (Nero)' : 'Nero (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'BOT (Bianco)' : 'Bianco (Giocatore 2)';

  return (
    <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-2 sm:px-4">
      {/* Top Player Indicator (White / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#ffffff"
        pieceIcon={<div className="w-2.5 h-2.5 rounded-full bg-white ring-1 ring-black/40" />}
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
      />

      {/* Board size toggle */}
      <div className="flex items-center justify-center w-full my-1.5 px-1 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10">
          {[9, 11, 15].map((n) => (
            <button
              key={n}
              onClick={() => handleRestart(n)}
              className={`px-2.5 py-1 rounded-lg font-black transition-colors ${
                boardSize === n ? 'bg-amber-500 text-stone-900 shadow-sm' : 'text-stone-600 dark:text-stone-300 hover:text-white'
              }`}
            >
              {n}×{n}
            </button>
          ))}
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

      {/* Bottom Player Indicator (Black / P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#1c1917"
        pieceIcon={<div className="w-2.5 h-2.5 rounded-full bg-stone-900 ring-1 ring-white/40" />}
        isCurrentTurn={gameState.turn === 0 && !gameState.gameOver}
        isFlipped={false}
      />

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
