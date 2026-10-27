import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  CheckersState,
  CheckersPiece,
  createInitialCheckersState,
  getMovesForPiece,
  getAllMovesForPlayer,
  applyCheckersMove,
  getBotCheckersMove,
  isPieceOfCurrentPlayer,
} from './checkersEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
import { motion } from 'motion/react';
import { GridSlidePiece, FADE } from '../../utils/animations';
import { Crown } from 'lucide-react';

type CheckersPieceNonNull = Exclude<CheckersPiece, null>;

const PieceDisc: React.FC<{ piece: CheckersPieceNonNull; isSelected: boolean }> = ({
  piece,
  isSelected,
}) => (
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
        <Crown className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-amber-300 fill-amber-300 drop-shadow" />
      )}
    </div>
  </div>
);

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
    if (playMode === 'bot' && gameState.turn === 'b' && !gameState.gameOver) {
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
  }, [gameState, playMode, difficulty]);

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

  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
  const moveKey = gameState.moveHistory.length;
  const isCapture = !!lastMove && Math.abs(lastMove.toR - lastMove.fromR) === 2;

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-[min(96vw,78vh)] mx-auto px-2 sm:px-4 flex-1 h-full min-h-0">
      {/* Top Player Indicator (Player 2: inverted in 1vs1 tabletop mode) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={playMode === 'bot' ? 'Nero (BOT)' : 'Nero (Giocatore 2)'}
        color="#1c1917"
        isCurrentTurn={gameState.turn === 'b' && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Pedine: ${12 - gameState.redCaptured}`}
      />

      {/* 8x8 Board Container - Maximized to full screen viewport */}
      <div
        className={`game-board-container relative w-full aspect-square my-auto p-2.5 sm:p-4 rounded-3xl shadow-2xl transition-transform ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{ backgroundColor: gameState.gameOver ? theme.boardBg : getTurnColor(gameState.turn === 'r' ? 0 : 1, playMode) }}
      >
        <div className="relative grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden shadow-inner border border-black/20">
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
                    backgroundColor: isDarkSquare ? '#8a5a33' : '#f0dcb0',
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
                  {piece &&
                    (lastMove && lastMove.toR === r && lastMove.toC === c ? (
                      <GridSlidePiece
                        fromRow={lastMove.fromR}
                        fromCol={lastMove.fromC}
                        toRow={r}
                        toCol={c}
                      >
                        <PieceDisc piece={piece} isSelected={isSelected} />
                      </GridSlidePiece>
                    ) : (
                      <PieceDisc piece={piece} isSelected={isSelected} />
                    ))}
                </button>
              );
            })
          )}

          {/* Capture ghost: fades the captured piece away at the midpoint */}
          {isCapture &&
            lastMove &&
            (() => {
              const mover = gameState.board[lastMove.toR][lastMove.toC];
              const capturedPiece: CheckersPieceNonNull =
                mover?.toLowerCase() === 'r' ? 'b' : 'r';
              return (
                <motion.div
                  key={moveKey}
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{
                    left: `${((lastMove.fromC + lastMove.toC) / 2) * 12.5}%`,
                    top: `${((lastMove.fromR + lastMove.toR) / 2) * 12.5}%`,
                    width: '12.5%',
                    height: '12.5%',
                    zIndex: 40,
                  }}
                  initial={{ opacity: 0.9, scale: 1 }}
                  animate={{ opacity: 0, scale: 0.6 }}
                  transition={{ ...FADE, delay: 0.1 }}
                >
                  <PieceDisc piece={capturedPiece} isSelected={false} />
                </motion.div>
              );
            })()}
        </div>
      </div>

      {/* Bottom Player Indicator (Player 1) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName="Rosso (Giocatore 1)"
        color="#ef4444"
        isCurrentTurn={gameState.turn === 'r' && !gameState.gameOver}
        isFlipped={false}
        score={`Pedine: ${12 - gameState.blackCaptured}`}
      />

      {/* Bot Thinking indicator */}
      {isBotThinking && (
        <div className="mt-2 text-xs font-black text-amber-500 animate-pulse flex items-center gap-1.5">
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
