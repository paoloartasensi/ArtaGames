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
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';

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
    <div className="flex flex-col items-center w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-2 sm:px-4">
      {/* Top Player Indicator (White / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#ffffff"
        pieceIcon={<div className="w-2.5 h-2.5 rounded-full bg-white ring-1 ring-black/40" />}
        isCurrentTurn={gameState.turn === 'white' && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Dischi: ${white}`}
      />

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

      {/* Bottom Player Indicator (Black / P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#1c1917"
        pieceIcon={<div className="w-2.5 h-2.5 rounded-full bg-stone-900 ring-1 ring-white/40" />}
        isCurrentTurn={gameState.turn === 'black' && !gameState.gameOver}
        isFlipped={false}
        score={`Dischi: ${black}`}
      />

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
