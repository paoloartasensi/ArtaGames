import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  TicTacToeState,
  createInitialTTTState,
  playTTTMove,
  getBotTTTMove,
} from './ticTacToeEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';

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
    if (playMode === 'bot' && gameState.turn === 'O' && !gameState.gameOver) {
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
  }, [gameState, playMode, difficulty]);

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

  const p1Name = 'Giocatore X';
  const p2Name = playMode === 'bot' ? 'BOT O' : 'Giocatore O';

  return (
    <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto px-2 sm:px-4">
      {/* Top Player Indicator (Player 2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#f59e0b"
        isCurrentTurn={gameState.turn === 'O' && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
      />

      {/* 3x3 Arena */}
      <div
        className={`game-board-container relative w-full aspect-square p-3 sm:p-5 md:p-6 rounded-3xl shadow-xl transition-transform ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{ backgroundColor: '#d9a66b' }}
      >
        <div className="grid grid-cols-3 grid-rows-3 gap-3 sm:gap-4 md:gap-5 w-full h-full bg-black/20 p-3 sm:p-4 md:p-5 rounded-2xl">
          {gameState.board.map((cell, idx) => {
            const win = isWinCell(idx);

            return (
              <button
                key={idx}
                onClick={() => handleClick(idx)}
                disabled={cell !== null || gameState.gameOver || isBotThinking}
                className={`rounded-2xl flex items-center justify-center transition-all bg-black/30 shadow-inner select-none ${
                  cell === null && !gameState.gameOver && !isBotThinking
                    ? 'hover:bg-white/20 active:scale-95'
                    : ''
                }`}
              >
                {cell === 'X' && (
                  <span
                    className={`font-black text-5xl sm:text-7xl md:text-8xl text-blue-400 drop-shadow ${
                      win ? 'scale-110 animate-pulse text-blue-300' : ''
                    }`}
                  >
                    X
                  </span>
                )}
                {cell === 'O' && (
                  <span
                    className={`font-black text-5xl sm:text-7xl md:text-8xl text-amber-400 drop-shadow ${
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

      {/* Bottom Player Indicator (Player 1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        isCurrentTurn={gameState.turn === 'X' && !gameState.gameOver}
        isFlipped={false}
      />

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
