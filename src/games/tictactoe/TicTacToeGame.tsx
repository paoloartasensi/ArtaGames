import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  TicTacToeState,
  createInitialTTTState,
  playTTTMove,
  getBotTTTMove,
} from './ticTacToeEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface TicTacToeGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<TicTacToeState>(createInitialTTTState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT turn
  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 'O' && !gameState.gameOver && !isBotThinking) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const botMove = getBotTTTMove(gameState, difficulty);
        const next = playTTTMove(gameState, botMove);
        if (next) {
          sound.playMove();
          setGameState(next);
        }
        setIsBotThinking(false);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [gameState, playMode, difficulty, isBotThinking]);

  const handleClick = (idx: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 'O') return;

    const next = playTTTMove(gameState, idx);
    if (next) {
      sound.playMove();
      setGameState(next);
    }
  };

  const handleRestart = () => {
    setGameState(createInitialTTTState());
  };

  const isWinCell = (idx: number) => {
    return gameState.winningLine?.includes(idx);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-2">
      {/* Player turn bar */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'X' && !gameState.gameOver
              ? 'ring-2 ring-blue-500 bg-blue-500/10'
              : 'opacity-70'
          }`}
        >
          <span className="font-bold text-blue-500 text-base">X</span>
          <span className="text-xs font-semibold">Giocatore X</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'O' && !gameState.gameOver
              ? 'ring-2 ring-amber-500 bg-amber-500/10'
              : 'opacity-70'
          }`}
        >
          <span className="text-xs font-semibold">
            {playMode === 'bot' ? 'BOT O' : 'Giocatore O'}
          </span>
          <span className="font-bold text-amber-500 text-base">O</span>
        </div>
      </div>

      {/* 3x3 Arena */}
      <div
        className={`game-board-container relative w-full aspect-square p-3 sm:p-4 rounded-3xl shadow-xl transition-transform ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{ backgroundColor: theme.boardBg }}
      >
        <div className="grid grid-cols-3 grid-rows-3 gap-2.5 w-full h-full bg-black/20 p-2.5 rounded-2xl">
          {gameState.board.map((cell, idx) => {
            const win = isWinCell(idx);

            return (
              <button
                key={idx}
                onClick={() => handleClick(idx)}
                disabled={cell !== null || gameState.gameOver || isBotThinking}
                className={`rounded-xl flex items-center justify-center transition-all bg-black/30 shadow-inner select-none ${
                  cell === null && !gameState.gameOver && !isBotThinking
                    ? 'hover:bg-white/20 active:scale-95'
                    : ''
                }`}
              >
                {cell === 'X' && (
                  <span
                    className={`font-black text-4xl sm:text-5xl text-blue-400 drop-shadow ${
                      win ? 'scale-110 animate-pulse text-blue-300' : ''
                    }`}
                  >
                    X
                  </span>
                )}
                {cell === 'O' && (
                  <span
                    className={`font-black text-4xl sm:text-5xl text-amber-400 drop-shadow ${
                      win ? 'scale-110 animate-pulse text-amber-300' : ''
                    }`}
                  >
                    O
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bot thinking */}
      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse">
          Il BOT sta scegliendo la casella...
        </div>
      )}

      {/* Victory modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Pareggio!'
            : gameState.winner === 'X'
            ? 'Vince la X! 🌟'
            : 'Vince la O! 🌟'
        }
        winnerSubtitle={
          gameState.winner === 'draw'
            ? 'Nessun 3 in fila: ottima difesa da entrambi!'
            : 'Tris completato! Chi vuole la rivincita?'
        }
        isDraw={gameState.winner === 'draw'}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
