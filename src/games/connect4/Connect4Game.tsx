import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  Connect4State,
  createInitialConnect4State,
  dropConnectPiece,
  getBotConnect4Move,
  COLS,
  ROWS,
} from './connect4Engine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
import { ArrowDown } from 'lucide-react';

interface Connect4GameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const Connect4Game: React.FC<Connect4GameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme, isDark } = useTheme();
  const [gameState, setGameState] = useState<Connect4State>(createInitialConnect4State());
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT turn handler
  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 'yellow' && !gameState.gameOver) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const botCol = getBotConnect4Move(gameState, difficulty);
        const next = dropConnectPiece(gameState, botCol);
        if (next) {
          sound.playStone();
          setGameState(next);
        }
        setIsBotThinking(false);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [gameState, playMode, difficulty]);

  const handleColumnClick = (c: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 'yellow') return;

    const next = dropConnectPiece(gameState, c);
    if (next) {
      sound.playStone();
      setGameState(next);
    }
  };

  const handleRestart = () => {
    setGameState(createInitialConnect4State());
  };

  const isWinningCell = (r: number, c: number) => {
    if (!gameState.winningLine) return false;
    return gameState.winningLine.cells.some((cell) => cell.r === r && cell.c === c);
  };

  const p1Name = 'Rosso (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Giallo (BOT)' : 'Giallo (Giocatore 2)';

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-2">
      {/* Top Player Status Indicator (Player 2: inverted in 1vs1 tabletop mode) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#facc15"
        isCurrentTurn={gameState.turn === 'yellow' && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
      />

      {/* Interactive Board Arena */}
      <div
        className={`game-board-container relative w-full aspect-[7/6] p-2.5 sm:p-4 rounded-3xl shadow-xl transition-transform ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{ backgroundColor: gameState.gameOver ? theme.boardBg : getTurnColor(gameState.turn === 'red' ? 0 : 1, playMode) }}
      >
        {/* Top Drop Affordance Bar */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
          {Array.from({ length: COLS }).map((_, c) => {
            const isColFull = gameState.board[0][c] !== null;
            return (
              <button
                key={c}
                onClick={() => handleColumnClick(c)}
                onMouseEnter={() => setHoverCol(c)}
                onMouseLeave={() => setHoverCol(null)}
                disabled={isColFull || gameState.gameOver || isBotThinking}
                title={`Inserisci in colonna ${c + 1}`}
                className={`h-8 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                  isColFull
                    ? 'opacity-20 cursor-not-allowed'
                    : hoverCol === c
                    ? 'bg-white/30 scale-105 shadow-sm'
                    : 'bg-black/10 hover:bg-white/20'
                }`}
              >
                <ArrowDown
                  className={`w-4 h-4 transition-transform ${
                    hoverCol === c ? 'translate-y-0.5 text-white' : 'text-stone-800 dark:text-stone-300'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* 6x7 Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 bg-gradient-to-b from-blue-600 to-blue-800 p-2 sm:p-3 rounded-2xl">
          {gameState.board.map((row, r) =>
            row.map((cell, c) => {
              const winning = isWinningCell(r, c);
              const isLastDrop = gameState.lastDrop?.r === r && gameState.lastDrop?.c === c;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleColumnClick(c)}
                  disabled={gameState.gameOver || isBotThinking}
                  className="aspect-square rounded-full flex items-center justify-center relative overflow-hidden transition-all bg-blue-950/80 shadow-inner"
                >
                  {cell && (
                    <div
                      className={`w-[85%] h-[85%] rounded-full shadow-md transition-all duration-200 transform scale-100 ${
                        cell === 'red'
                          ? 'bg-gradient-to-tr from-red-600 to-red-400'
                          : 'bg-gradient-to-tr from-amber-500 to-amber-300'
                      } ${winning ? 'ring-4 ring-white animate-pulse scale-105' : ''} ${
                        isLastDrop ? 'ring-2 ring-white/60' : ''
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Player Status Indicator (Player 1: always normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#ef4444"
        isCurrentTurn={gameState.turn === 'red' && !gameState.gameOver}
        isFlipped={false}
      />

      {/* Bot Thinking indicator */}
      {isBotThinking && (
        <div className="mt-2 text-xs font-black text-amber-500 animate-pulse flex items-center gap-1.5">
          <span>Il BOT sta pensando alla mossa migliore...</span>
        </div>
      )}

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Pareggio Amichevole!'
            : gameState.winner === 'red'
            ? 'Vince il Rosso! 🎉'
            : 'Vince il Giallo! 🎉'
        }
        winnerSubtitle={
          gameState.winner === 'draw'
            ? 'Tutta la griglia è stata riempita. Grandissima sfida!'
            : gameState.winner === 'red'
            ? playMode === 'bot'
              ? 'Bravissimo! Hai battuto il BOT con 4 in fila!'
              : 'Complimenti al Giocatore 1 per il 4 in fila!'
            : playMode === 'bot'
            ? 'Il BOT è riuscito a fare 4 in fila. Rivincita?'
            : 'Complimenti al Giocatore 2 per il 4 in fila!'
        }
        isDraw={gameState.winner === 'draw'}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
