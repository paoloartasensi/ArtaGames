import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  GoState,
  createInitialGoState,
  playGoMove,
  passGoTurn,
  getBotGoMove,
  BoardSize,
  getGroupAndLiberties,
} from './goEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { SkipForward, Eye } from 'lucide-react';

interface GoGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const GoGame: React.FC<GoGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme, isDark } = useTheme();
  const [boardSize, setBoardSize] = useState<BoardSize>(9);
  const [gameState, setGameState] = useState<GoState>(() => createInitialGoState(9));
  const [showLibertiesHint, setShowLibertiesHint] = useState(true);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT AI turn
  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 'W' && !gameState.gameOver && !isBotThinking) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const botMove = getBotGoMove(gameState, difficulty);
        if (botMove === 'pass') {
          sound.playTick();
          setGameState((prev) => passGoTurn(prev));
        } else {
          const next = playGoMove(gameState, botMove.r, botMove.c);
          if (next) {
            if (next.capturedB > gameState.capturedB || next.capturedW > gameState.capturedW) {
              sound.playCapture();
            } else {
              sound.playStone();
            }
            setGameState(next);
          }
        }
        setIsBotThinking(false);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [gameState, playMode, difficulty, isBotThinking]);

  const handleIntersectionClick = (r: number, c: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 'W') return;

    const next = playGoMove(gameState, r, c);
    if (next) {
      if (next.capturedB > gameState.capturedB || next.capturedW > gameState.capturedW) {
        sound.playCapture();
      } else {
        sound.playStone();
      }
      setGameState(next);
    } else {
      sound.playTick();
    }
  };

  const handlePass = () => {
    sound.playTick();
    setGameState(passGoTurn(gameState));
  };

  const handleRestart = (newSize?: BoardSize) => {
    const s = newSize || boardSize;
    if (newSize) setBoardSize(newSize);
    setGameState(createInitialGoState(s));
  };

  // Find stones with 1 liberty (Atari) to help kids see danger!
  const stonesInAtari = new Set<string>();
  if (showLibertiesHint) {
    for (let r = 0; r < gameState.size; r++) {
      for (let c = 0; c < gameState.size; c++) {
        if (gameState.board[r][c] !== null) {
          const { liberties } = getGroupAndLiberties(gameState.board, r, c);
          if (liberties.size === 1) {
            stonesInAtari.add(`${r},${c}`);
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      {/* Board Size Toggle for Kids (9x9 standard vs 13x13) */}
      <div className="flex items-center justify-between w-full mb-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10">
          <button
            onClick={() => handleRestart(9)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              boardSize === 9 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            9x9 Rapido (Kids)
          </button>
          <button
            onClick={() => handleRestart(13)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              boardSize === 13 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            13x13 Medio
          </button>
        </div>

        {/* Liberties hint toggle */}
        <button
          onClick={() => setShowLibertiesHint(!showLibertiesHint)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-colors ${
            showLibertiesHint
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'border-white/10 text-slate-400'
          }`}
          title="Evidenzia in rosso le pietre con 1 solo respiro (in pericolo di cattura!)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Aiuto Respiri</span>
        </button>
      </div>

      {/* Turn indicator & captured counts */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'B' && !gameState.gameOver
              ? 'ring-2 ring-stone-900 bg-stone-900/20'
              : 'opacity-70'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-stone-950 border border-stone-700 shadow-sm" />
          <span className="text-xs font-semibold">Nero (P1)</span>
          <span className="text-[11px] opacity-75">· {gameState.capturedW} catturate</span>
        </div>

        <button
          onClick={handlePass}
          disabled={gameState.gameOver || isBotThinking}
          title="Passa il turno se non hai altre mosse"
          className="px-3 py-1 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Passa</span>
        </button>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 'W' && !gameState.gameOver
              ? 'ring-2 ring-white bg-white/20'
              : 'opacity-70'
          }`}
        >
          <span className="text-[11px] opacity-75">{gameState.capturedB} catturate ·</span>
          <span className="text-xs font-semibold">
            {playMode === 'bot' ? 'Bianco (BOT)' : 'Bianco (P2)'}
          </span>
          <div className="w-4 h-4 rounded-full bg-stone-100 border border-stone-300 shadow-sm" />
        </div>
      </div>

      {/* Go Goban Board */}
      <div
        className={`game-board-container relative w-full aspect-square p-4 sm:p-6 rounded-2xl shadow-xl transition-transform ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{
          backgroundColor: theme.boardBg,
        }}
      >
        {/* Goban Grid lines container */}
        <div className="relative w-full h-full">
          {/* SVG Grid Lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${boardSize - 1} ${boardSize - 1}`}
          >
            {/* Horizontal lines */}
            {Array.from({ length: boardSize }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i}
                x2={boardSize - 1}
                y2={i}
                stroke={theme.boardGrid}
                strokeWidth={0.06}
              />
            ))}
            {/* Vertical lines */}
            {Array.from({ length: boardSize }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i}
                y1={0}
                x2={i}
                y2={boardSize - 1}
                stroke={theme.boardGrid}
                strokeWidth={0.06}
              />
            ))}
            {/* Star points (Hoshi) */}
            {boardSize === 9 && (
              <>
                <circle cx={2} cy={2} r={0.15} fill={theme.boardGrid} />
                <circle cx={6} cy={2} r={0.15} fill={theme.boardGrid} />
                <circle cx={4} cy={4} r={0.15} fill={theme.boardGrid} />
                <circle cx={2} cy={6} r={0.15} fill={theme.boardGrid} />
                <circle cx={6} cy={6} r={0.15} fill={theme.boardGrid} />
              </>
            )}
          </svg>

          {/* Interactive Intersections */}
          <div
            className="grid w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
            }}
          >
            {gameState.board.map((row, r) =>
              row.map((stone, c) => {
                const isLastMove = gameState.lastMove?.r === r && gameState.lastMove?.c === c;
                const inAtari = stonesInAtari.has(`${r},${c}`);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleIntersectionClick(r, c)}
                    disabled={gameState.gameOver || isBotThinking}
                    className="relative flex items-center justify-center p-0 focus:outline-none group"
                  >
                    {/* Hover ghost stone indicator */}
                    {!stone && !gameState.gameOver && !isBotThinking && (
                      <div
                        className={`w-[60%] h-[60%] rounded-full opacity-0 group-hover:opacity-40 transition-opacity ${
                          gameState.turn === 'B' ? 'bg-stone-900' : 'bg-white'
                        }`}
                      />
                    )}

                    {/* Placed Stone */}
                    {stone && (
                      <div
                        className={`w-[85%] h-[85%] rounded-full shadow-lg transition-transform ${
                          stone === 'B'
                            ? 'bg-gradient-to-br from-stone-800 to-stone-950 border border-stone-700'
                            : 'bg-gradient-to-br from-white to-stone-200 border border-stone-300'
                        } ${inAtari ? 'ring-2 ring-red-500 animate-pulse' : ''} ${
                          isLastMove ? 'ring-2 ring-amber-400' : ''
                        }`}
                      >
                        {/* Highlight dot for last placed stone */}
                        {isLastMove && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mx-auto mt-1" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bot Thinking indicator */}
      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse flex items-center gap-1.5">
          <span>Il BOT sta ponderando la posizione...</span>
        </div>
      )}

      {/* Victory modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Pareggio!'
            : gameState.winner === 'B'
            ? 'Vince il Nero! ⚪⚫'
            : 'Vince il Bianco! ⚪⚫'
        }
        winnerSubtitle={
          gameState.winner === 'draw'
            ? 'Territori perfettamente uguali!'
            : `Punteggio finale: Nero ${gameState.scoreB ?? 0} pt · Bianco ${gameState.scoreW ?? 0} pt (con komi).`
        }
        isDraw={gameState.winner === 'draw'}
        onRematch={() => handleRestart()}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
