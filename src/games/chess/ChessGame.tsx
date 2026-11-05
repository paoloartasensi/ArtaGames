import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  ChessState,
  createInitialChessState,
  movesForPiece,
  ChessVariant,
  applyChessMove,
  getBotChessMove,
  ChessPiece,
} from './chessEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
import { motion } from '../../utils/motion';
import { GridSlidePiece, FADE } from '../../utils/animations';
import { AlertCircle } from 'lucide-react';

interface ChessGameProps {
  variant?: ChessVariant;
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

const PieceGlyph: React.FC<{ piece: ChessPiece; isSelected: boolean; upsideDown?: boolean }> = ({
  piece,
  isSelected,
  upsideDown = false,
}) => (
  // Outer wrapper rotates the piece 180° for the player sitting on the other side of the
  // table (own element, so it doesn't fight with the scale transform below).
  <span
    className="relative z-20 inline-block leading-none"
    style={upsideDown ? { transform: 'rotate(180deg)', WebkitTransform: 'rotate(180deg)' } : undefined}
  >
  <span
    className={`relative z-20 text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none select-none drop-shadow transition-transform ${
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
  </span>
);

export const ChessGame: React.FC<ChessGameProps> = ({
  variant = 'classic',
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme, isDark } = useTheme();
  // 2 giocatori uno di fronte all'altro: i pezzi neri sono girati verso il Nero
  const faceToFace = playMode === 'local_pvp';
  const [gameState, setGameState] = useState<ChessState>(createInitialChessState(variant));
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
      const moves = movesForPiece(gameState, r, c);
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
    setGameState(createInitialChessState(variant));
  };

  const selectedPieceName = gameState.selectedPos
    ? PIECE_NAMES[gameState.board[gameState.selectedPos.r][gameState.selectedPos.c]?.type || '']
    : null;

  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
  const moveKey = gameState.moveHistory.length;

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-[min(96vw,78vh)] mx-auto px-2 sm:px-4 flex-1 h-full min-h-0">
      {/* Top Player Indicator (Player 2 / Black: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={playMode === 'bot' ? 'Nero (BOT)' : 'Nero (Giocatore 2)'}
        color="#1c1917"
        pieceIcon={<span className="text-white text-xs">♚</span>}
        isCurrentTurn={gameState.turn === 'b' && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Catturati: ${gameState.blackCaptured.length}`}
      />

      {/* Check Alert Banner */}
      {gameState.inCheck && !gameState.gameOver && (
        <div className="w-full bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-xl mb-2 flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
          <AlertCircle className="w-4 h-4" />
          <span>{gameState.kingCapture ? 'Attenzione: il tuo Re può essere mangiato!' : 'Attenzione: Re sotto Scacco!'}</span>
        </div>
      )}

      {/* Selected Piece Hint Banner for Kids */}
      {selectedPieceName && (
        <div className="text-[11px] text-amber-400 font-semibold mb-2">
          Pezzo selezionato: {selectedPieceName} · I puntini verdi mostrano dove può andare!
        </div>
      )}

      {/* 8x8 Chessboard - Maximized for iPad */}
      <div
        className={`game-board-container relative w-full aspect-square my-auto p-2.5 sm:p-4 rounded-3xl shadow-2xl transition-transform ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{ backgroundColor: gameState.gameOver ? theme.boardBg : getTurnColor(gameState.turn === 'w' ? 0 : 1, playMode) }}
      >
        <div className="relative grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden shadow-inner border border-black/20">
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
                    backgroundColor: isDarkSquare ? '#8a5a33' : '#f0dcb0',
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
                  {piece &&
                    (lastMove && lastMove.toR === r && lastMove.toC === c ? (
                      <GridSlidePiece
                        fromRow={lastMove.fromR}
                        fromCol={lastMove.fromC}
                        toRow={r}
                        toCol={c}
                      >
                        <PieceGlyph piece={piece} isSelected={isSelected} upsideDown={faceToFace && piece.color === 'b'} />
                      </GridSlidePiece>
                    ) : (
                      <PieceGlyph piece={piece} isSelected={isSelected} upsideDown={faceToFace && piece.color === 'b'} />
                    ))}
                </button>
              );
            })
          )}

          {/* Capture ghost: fades the captured piece away at the destination */}
          {lastMove?.captured && (
            <motion.div
              key={moveKey}
              className="absolute pointer-events-none flex items-center justify-center"
              style={{
                left: `${lastMove.toC * 12.5}%`,
                top: `${lastMove.toR * 12.5}%`,
                width: '12.5%',
                height: '12.5%',
                zIndex: 40,
              }}
              initial={{ opacity: 0.9, scale: 1 }}
              animate={{ opacity: 0, scale: 0.7 }}
              transition={{ ...FADE, delay: 0.1 }}
            >
              <PieceGlyph piece={lastMove.captured} isSelected={false} upsideDown={faceToFace && lastMove.captured.color === 'b'} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Player Indicator (Player 1 / White: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName="Bianco (Giocatore 1)"
        color="#fef08a"
        pieceIcon={<span className="text-stone-900 text-xs">♔</span>}
        isCurrentTurn={gameState.turn === 'w' && !gameState.gameOver}
        isFlipped={false}
        score={`Catturati: ${gameState.whiteCaptured.length}`}
      />

      {/* Bot Thinking indicator */}
      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse flex items-center gap-1.5">
          <span>Il BOT sta studiando la mossa...</span>
        </div>
      )}

      {/* Victory modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Patta! 🤝'
            : gameState.kingCapture
            ? gameState.winner === 'w'
              ? 'Re mangiato! Vince il Bianco 👑'
              : 'Re mangiato! Vince il Nero 👑'
            : gameState.winner === 'w'
            ? 'Scacco matto! Vince il Bianco 👑'
            : 'Scacco matto! Vince il Nero 👑'
        }
        winnerSubtitle={
          gameState.winner === 'draw'
            ? 'Nessuno può più vincere: la partita finisce in parità.'
            : gameState.winner === 'w'
            ? playMode === 'bot'
              ? gameState.kingCapture
                ? 'Complimenti! Hai mangiato il Re del BOT!'
                : 'Complimenti grandissimo scacchista! Hai dato scacco matto al BOT!'
              : 'Grandissima partita per il Giocatore Bianco!'
            : playMode === 'bot'
            ? gameState.kingCapture
              ? 'Il BOT ha mangiato il tuo Re. Vuoi la rivincita?'
              : 'Il BOT ti ha dato scacco matto. Vuoi la rivincita?'
            : 'Grandissima partita per il Giocatore Nero!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
