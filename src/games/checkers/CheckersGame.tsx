import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  CheckersState,
  createInitialCheckersState,
  getMovesForPiece,
  getAllMovesForPlayer,
  applyCheckersMove,
  getBotCheckersMove,
  isPieceOfCurrentPlayer,
} from './checkersEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { Crown } from 'lucide-react';

interface CheckersGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const CheckersGame: React.FC<CheckersGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme, isDark } = useTheme();
  const [gameState, setGameState] = useState<CheckersState>(createInitialCheckersState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT AI turn
  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 'b' && !gameState.gameOver && !isBotThinking) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const botMove = getBotCheckersMove(gameState, difficulty);
        if (botMove) {
          if (botMove.captures) {
            sound.playCapture();
          } else {
            sound.playMove();
          }
          setGameState((prev) => applyCheckersMove(prev, botMove));
        }
        setIsBotThinking(false);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [gameState, playMode, difficulty, isBotThinking]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 'b') return;

    // If active multi-jump piece is locked, only allow moves from it
    if (gameState.activeJumpPiece) {
      const isTargetMove = gameState.validMoves.find((m) => m.toR === r && m.toC === c);
      if (isTargetMove) {
        sound.playCapture();
        setGameState(applyCheckersMove(gameState, isTargetMove));
      }
      return;
    }

    const clickedPiece = gameState.board[r][c];

    // Case 1: Clicked own piece -> select it and show legal moves
    if (clickedPiece && isPieceOfCurrentPlayer(clickedPiece, gameState.turn)) {
      const pieceMoves = getMovesForPiece(gameState.board, r, c);
      // Filter if there are mandatory captures
      const allMoves = getAllMovesForPlayer(gameState.board, gameState.turn);
      const hasCaptures = allMoves.some((m) => !!m.captures);

      const filtered = hasCaptures ? pieceMoves.filter((m) => !!m.captures) : pieceMoves;

      sound.playTick();
      setGameState({
        ...gameState,
        selectedPiece: { r, c },
        validMoves: filtered,
      });
      return;
    }

    // Case 2: Clicked target square while a piece is selected
    if (gameState.selectedPiece) {
      const move = gameState.validMoves.find((m) => m.toR === r && m.toC === c);
      if (move) {
        if (move.captures) sound.playCapture();
        else sound.playMove();

        setGameState(applyCheckersMove(gameState, move));
      } else {
        // Deselect
        setGameState({
          ...gameState,
          selectedPiece: null,
          validMoves: [],
        });
      }
    }
  };

  const handleRestart = () => {
    setGameState(createInitialCheckersState());
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      {/* Turn indicator & captured counts */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'r' && !gameState.gameOver
              ? 'ring-2 ring-red-500 bg-red-500/10'
              : 'opacity-70'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm" />
          <span className="text-xs font-semibold">Rosso (P1)</span>
          <span className="text-[11px] opacity-75">· {12 - gameState.blackCaptured} rimasti</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'b' && !gameState.gameOver
              ? 'ring-2 ring-slate-400 bg-slate-500/10'
              : 'opacity-70'
          }`}
        >
          <span className="text-[11px] opacity-75">{12 - gameState.redCaptured} rimasti ·</span>
          <span className="text-xs font-semibold">
            {playMode === 'bot' ? 'Nero (BOT)' : 'Nero (P2)'}
          </span>
          <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600 shadow-sm" />
        </div>
      </div>

      {/* 8x8 Board Container */}
      <div
        className={`game-board-container relative w-full aspect-square p-2.5 sm:p-3.5 rounded-2xl shadow-xl transition-transform ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{ backgroundColor: theme.boardBg }}
      >
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden shadow-inner border border-black/20">
          {gameState.board.map((row, r) =>
            row.map((piece, c) => {
              const isDarkSquare = (r + c) % 2 === 1;
              const isSelected = gameState.selectedPiece?.r === r && gameState.selectedPiece?.c === c;
              const isValidTarget = gameState.validMoves.find((m) => m.toR === r && m.toC === c);
              const isCaptureTarget = isValidTarget?.captures;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={gameState.gameOver || isBotThinking}
                  className="relative aspect-square flex items-center justify-center transition-colors focus:outline-none"
                  style={{
                    backgroundColor: isDarkSquare ? theme.cellDark : theme.cellLight,
                  }}
                >
                  {/* Selected square highlight */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-500/30 ring-2 ring-amber-400 inset-ring" />
                  )}

                  {/* Valid move target dot / capture ring */}
                  {isValidTarget && (
                    <div
                      className={`absolute z-10 rounded-full transition-transform transform scale-100 animate-pulse ${
                        isCaptureTarget
                          ? 'w-7 h-7 sm:w-8 sm:h-8 border-2 border-red-400 bg-red-500/20'
                          : 'w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-400/80 shadow-md'
                      }`}
                    />
                  )}

                  {/* Checkers Piece */}
                  {piece && (
                    <div
                      className={`relative z-20 w-[82%] h-[82%] rounded-full shadow-md flex items-center justify-center transition-transform ${
                        piece.toLowerCase() === 'r'
                          ? 'bg-gradient-to-tr from-red-600 to-red-400 border border-red-300'
                          : 'bg-gradient-to-tr from-stone-900 to-stone-700 border border-stone-600 text-stone-200'
                      } ${isSelected ? 'scale-110 ring-2 ring-white shadow-lg' : ''}`}
                    >
                      {/* Inner concentric ring for traditional tactile feel */}
                      <div className="w-[65%] h-[65%] rounded-full border border-white/20 flex items-center justify-center">
                        {(piece === 'R' || piece === 'B') && (
                          <Crown className="w-4 h-4 text-amber-300 fill-amber-300 drop-shadow" />
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Bot Thinking indicator */}
      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse flex items-center gap-1.5">
          <span>Il BOT sta calcolando la mossa...</span>
        </div>
      )}

      {/* Victory Modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={gameState.winner === 'r' ? 'Vince il Rosso! 🏆' : 'Vince il Nero! 🏆'}
        winnerSubtitle={
          gameState.winner === 'r'
            ? playMode === 'bot'
              ? 'Bravissimo! Hai catturato tutte le pedine del BOT!'
              : 'Grandissima partita per il Giocatore 1!'
            : playMode === 'bot'
            ? 'Il BOT ha vinto questa manche. Riprova subito!'
            : 'Grandissima partita per il Giocatore 2!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
