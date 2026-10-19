import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  ChessState,
  createInitialChessState,
  getPieceMoves,
  applyChessMove,
  getBotChessMove,
  ChessPiece,
} from './chessEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { AlertCircle } from 'lucide-react';

interface ChessGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const PIECE_GLYPHS: Record<string, string> = {
  'w-k': '♔',
  'w-q': '♕',
  'w-r': '♖',
  'w-b': '♗',
  'w-n': '♘',
  'w-p': '♙',
  'b-k': '♚',
  'b-q': '♛',
  'b-r': '♜',
  'b-b': '♝',
  'b-n': '♞',
  'b-p': '♟',
};

const PIECE_NAMES: Record<string, string> = {
  k: 'Re',
  q: 'Regina',
  r: 'Torre',
  b: 'Alfiere',
  n: 'Cavallo',
  p: 'Pedone',
};

export const ChessGame: React.FC<ChessGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme, isDark } = useTheme();
  const [gameState, setGameState] = useState<ChessState>(createInitialChessState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT Move
  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 'b' && !gameState.gameOver) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const botMove = getBotChessMove(gameState, difficulty);
        if (botMove) {
          if (botMove.captured) sound.playCapture();
          else sound.playMove();

          setGameState((prev) => applyChessMove(prev, botMove));
        }
        setIsBotThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [gameState, playMode, difficulty]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 'b') return;

    const clickedPiece = gameState.board[r][c];

    // Case 1: Clicked friendly piece -> select and show available moves
    if (clickedPiece && clickedPiece.color === gameState.turn) {
      sound.playTick();
      const moves = getPieceMoves(gameState.board, r, c);
      setGameState({
        ...gameState,
        selectedPos: { r, c },
        validMoves: moves,
      });
      return;
    }

    // Case 2: Clicked valid destination for already selected piece
    if (gameState.selectedPos) {
      const move = gameState.validMoves.find((m) => m.toR === r && m.toC === c);
      if (move) {
        if (move.captured) sound.playCapture();
        else sound.playMove();

        setGameState(applyChessMove(gameState, move));
      } else {
        // Deselect
        setGameState({
          ...gameState,
          selectedPos: null,
          validMoves: [],
        });
      }
    }
  };

  const handleRestart = () => {
    setGameState(createInitialChessState());
  };

  const selectedPieceName = gameState.selectedPos
    ? PIECE_NAMES[gameState.board[gameState.selectedPos.r][gameState.selectedPos.c]?.type || '']
    : null;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      {/* Player turn bar */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'w' && !gameState.gameOver
              ? 'ring-2 ring-amber-400 bg-amber-400/10'
              : 'opacity-70'
          }`}
        >
          <span className="text-lg">♔</span>
          <span className="text-xs font-semibold">Bianco (P1)</span>
          <span className="text-[11px] opacity-75">· {gameState.whiteCaptured.length} catturati</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'b' && !gameState.gameOver
              ? 'ring-2 ring-slate-400 bg-slate-500/10'
              : 'opacity-70'
          }`}
        >
          <span className="text-[11px] opacity-75">{gameState.blackCaptured.length} catturati ·</span>
          <span className="text-xs font-semibold">
            {playMode === 'bot' ? 'Nero (BOT)' : 'Nero (P2)'}
          </span>
          <span className="text-lg">♚</span>
        </div>
      </div>

      {/* Check Alert Banner */}
      {gameState.inCheck && !gameState.gameOver && (
        <div className="w-full bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-xl mb-2 flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
          <AlertCircle className="w-4 h-4" />
          <span>Attenzione: Re sotto Scacco!</span>
        </div>
      )}

      {/* Selected Piece Hint Banner for Kids */}
      {selectedPieceName && (
        <div className="text-[11px] text-amber-400 font-semibold mb-2">
          Pezzo selezionato: {selectedPieceName} · I puntini verdi mostrano dove può andare!
        </div>
      )}

      {/* 8x8 Chessboard */}
      <div
        className={`game-board-container relative w-full aspect-square p-2.5 sm:p-3.5 rounded-2xl shadow-xl transition-transform ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{ backgroundColor: gameState.gameOver ? theme.boardBg : getTurnColor(gameState.turn === 'w' ? 0 : 1, playMode) }}
      >
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden shadow-inner border border-black/20">
          {gameState.board.map((row, r) =>
            row.map((piece, c) => {
              const isDarkSquare = (r + c) % 2 === 1;
              const isSelected = gameState.selectedPos?.r === r && gameState.selectedPos?.c === c;
              const isValidTarget = gameState.validMoves.find((m) => m.toR === r && m.toC === c);
              const isCapture = isValidTarget?.captured;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={gameState.gameOver || isBotThinking}
                  className="relative aspect-square flex items-center justify-center select-none focus:outline-none transition-colors"
                  style={{
                    backgroundColor: isDarkSquare ? theme.cellDark : theme.cellLight,
                  }}
                >
                  {/* Selected Highlight */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-400/30 ring-2 ring-amber-400" />
                  )}

                  {/* Target Hint Dot / Capture Ring */}
                  {isValidTarget && (
                    <div
                      className={`absolute z-10 rounded-full animate-pulse pointer-events-none ${
                        isCapture
                          ? 'w-7 h-7 sm:w-8 sm:h-8 border-2 border-red-500 bg-red-500/20'
                          : 'w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-400/80 shadow'
                      }`}
                    />
                  )}

                  {/* Piece Glyph */}
                  {piece && (
                    <span
                      className={`relative z-20 text-3xl sm:text-4xl leading-none select-none drop-shadow transition-transform ${
                        piece.color === 'w' ? 'text-white' : 'text-stone-950 dark:text-stone-900'
                      } ${isSelected ? 'scale-115' : 'hover:scale-105'}`}
                      style={{
                        textShadow:
                          piece.color === 'w'
                            ? '0 1px 3px rgba(0,0,0,0.6)'
                            : '0 0 2px rgba(255,255,255,0.4)',
                      }}
                    >
                      {PIECE_GLYPHS[`${piece.color}-${piece.type}`]}
                    </span>
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
          <span>Il BOT sta studiando la mossa...</span>
        </div>
      )}

      {/* Victory modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={gameState.winner === 'w' ? 'Vittoria del Bianco! 👑' : 'Vittoria del Nero! 👑'}
        winnerSubtitle={
          gameState.winner === 'w'
            ? playMode === 'bot'
              ? 'Complimenti grandissimo scacchista! Hai catturato il Re del BOT!'
              : 'Grandissima partita per il Giocatore Bianco!'
            : playMode === 'bot'
            ? 'Il BOT è riuscito a catturare il tuo Re. Vuoi la rivincita?'
            : 'Grandissima partita per il Giocatore Nero!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
