import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  ReversiState,
  createInitialReversiState,
  placeReversi,
  autoPassReversi,
  getBotReversiMove,
  REVERSI_SIZE,
} from './reversiEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface ReversiGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const ReversiGame: React.FC<ReversiGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<ReversiState>(createInitialReversiState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Auto-pass when the active player has no legal move.
  useEffect(() => {
    if (!gameState.gameOver && gameState.legalMoves.length === 0) {
      const t = setTimeout(() => {
        setGameState((s) => autoPassReversi(s) ?? s);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [gameState.legalMoves, gameState.gameOver]);

  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 'white' && !gameState.gameOver) {
      setIsBotThinking(true);
      const t = setTimeout(() => {
        const mv = getBotReversiMove(gameState, difficulty);
        if (mv) {
          const next = placeReversi(gameState, mv.r, mv.c);
          if (next) {
            sound.playStone();
            setGameState(next);
          }
        }
        setIsBotThinking(false);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [gameState, playMode, difficulty]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 'white') return;
    const next = placeReversi(gameState, r, c);
    if (next) {
      sound.playStone();
      setGameState(next);
    }
  };

  const handleRestart = () => setGameState(createInitialReversiState());

  const isLegal = (r: number, c: number) => gameState.legalMoves.some((m) => m.r === r && m.c === c);
  const isLast = (r: number, c: number) => gameState.lastMove?.r === r && gameState.lastMove?.c === c;

  let black = 0;
  let white = 0;
  for (const row of gameState.board) {
    for (const cell of row) {
      if (cell === 'black') black++;
      else if (cell === 'white') white++;
    }
  }

  const p1Name = 'Nero (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Bianco (BOT)' : 'Bianco (Giocatore 2)';

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      {/* Turn + score */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'black' && !gameState.gameOver ? 'ring-2 ring-stone-800 dark:ring-white bg-black/10' : 'opacity-70'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-stone-900 dark:bg-white shadow-sm" />
          <span className="text-xs font-semibold">{p1Name}</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs font-bold">{black}</span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'white' && !gameState.gameOver ? 'ring-2 ring-stone-400 bg-white/20' : 'opacity-70'
          }`}
        >
          <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs font-bold">{white}</span>
          <span className="text-xs font-semibold">{p2Name}</span>
          <div className="w-4 h-4 rounded-full bg-white shadow-sm ring-1 ring-black/20" />
        </div>
      </div>

      {/* Board */}
      <div
        className={`w-full aspect-square rounded-3xl p-2 sm:p-3 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: gameState.gameOver ? theme.boardBg : getTurnColor(gameState.turn === 'black' ? 0 : 1, playMode) }}
      >
        <div className="grid grid-cols-8 gap-0.5 h-full w-full bg-black/20 rounded-xl p-1">
          {gameState.board.map((row, r) =>
            row.map((cell, c) => {
              const legal = isLegal(r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!legal || gameState.gameOver || isBotThinking}
                  className="aspect-square rounded-sm flex items-center justify-center transition-colors bg-emerald-700/70 dark:bg-emerald-900/50"
                >
                  {cell && (
                    <div
                      className={`w-[80%] h-[80%] rounded-full shadow-md ${
                        cell === 'black'
                          ? 'bg-gradient-to-tr from-stone-800 to-stone-500'
                          : 'bg-gradient-to-tr from-white to-stone-200'
                      } ${isLast(r, c) ? 'ring-2 ring-amber-400' : ''}`}
                    />
                  )}
                  {!cell && legal && <div className="w-2.5 h-2.5 rounded-full bg-white/30" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse">Il BOT sta pensando...</div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Pareggio Amichevole!'
            : gameState.winner === 'black'
            ? 'Vince il Nero! 🎉'
            : 'Vince il Bianco! 🎉'
        }
        winnerSubtitle={
          gameState.winner === 'draw'
            ? 'Stesso numero di dischi!'
            : gameState.winner === 'black'
            ? playMode === 'bot'
              ? 'Hai girato più dischi del BOT!'
              : 'Complimenti al Giocatore 1!'
            : playMode === 'bot'
            ? 'Il BOT ha conquistato la scacchiera. Rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        isDraw={gameState.winner === 'draw'}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
