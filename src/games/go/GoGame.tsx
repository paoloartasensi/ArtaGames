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
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
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
    if (playMode === 'bot' && gameState.turn === 'W' && !gameState.gameOver) {
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
  }, [gameState, playMode, difficulty]);

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

  const p1Name = 'Nero (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Bianco (BOT)' : 'Bianco (Giocatore 2)';

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-[min(96vw,78vh)] mx-auto px-2 sm:px-4 flex-1 h-full min-h-0 select-none">
      {/* Top Player Indicator (Bianco / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#ffffff"
        pieceIcon={<div className="w-2.5 h-2.5 rounded-full bg-white ring-1 ring-black/40" />}
        isCurrentTurn={gameState.turn === 'W' && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Catturate: ${gameState.capturedB}`}
        actionButton={
          playMode === 'local_pvp' && gameState.turn === 'W' && !gameState.gameOver ? (
            <button
              onClick={handlePass}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md active:translate-y-0.5 uppercase tracking-wider flex items-center gap-1"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Passa</span>
            </button>
          ) : undefined
        }
      />

      {/* Board Size Toggle for Kids (9x9 standard vs 13x13) & hint */}
      <div className="flex items-center justify-between w-full my-1 px-1 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10">
          <button
            onClick={() => handleRestart(9)}
            className={`px-2.5 py-1 rounded-lg font-black transition-colors ${
              boardSize === 9 ? 'bg-amber-500 text-stone-900 shadow-sm' : 'text-stone-600 dark:text-stone-300 hover:text-white'
            }`}
          >
            9x9
          </button>
          <button
            onClick={() => handleRestart(13)}
            className={`px-2.5 py-1 rounded-lg font-black transition-colors ${
              boardSize === 13 ? 'bg-amber-500 text-stone-900 shadow-sm' : 'text-stone-600 dark:text-stone-300 hover:text-white'
            }`}
          >
            13x13
          </button>
        </div>

        {/* Liberties hint toggle */}
        <button
          onClick={() => setShowLibertiesHint(!showLibertiesHint)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-black transition-colors ${
            showLibertiesHint
              ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
              : 'border-black/10 dark:border-white/10 text-stone-400'
          }`}
          title="Evidenzia in rosso le pietre con 1 solo respiro"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Aiuto Respiri</span>
        </button>
      </div>

      {/* Go Goban Board */}
      <div
        className={`game-board-container relative w-full aspect-square my-auto p-3 sm:p-5 rounded-3xl shadow-2xl transition-transform border-4 border-[#b87d37] ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{
          background: 'linear-gradient(135deg, #eec27e 0%, #e5b367 50%, #d49e52 100%)',
        }}
      >
        {/* Goban Grid lines container */}
        <div className="relative w-full h-full">
          {/* SVG Grid Lines - Exactly aligned with button grid cells */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${boardSize} ${boardSize}`}
          >
            {/* Horizontal lines */}
            {Array.from({ length: boardSize }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0.5}
                y1={i + 0.5}
                x2={boardSize - 0.5}
                y2={i + 0.5}
                stroke="#3a2a18"
                strokeWidth={0.045}
              />
            ))}
            {/* Vertical lines */}
            {Array.from({ length: boardSize }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i + 0.5}
                y1={0.5}
                x2={i + 0.5}
                y2={boardSize - 0.5}
                stroke="#3a2a18"
                strokeWidth={0.045}
              />
            ))}
            {/* Star points (Hoshi) positioned exactly on intersection centers */}
            {boardSize === 9 && (
              <>
                <circle cx={2.5} cy={2.5} r={0.12} fill="#3a2a18" />
                <circle cx={6.5} cy={2.5} r={0.12} fill="#3a2a18" />
                <circle cx={4.5} cy={4.5} r={0.14} fill="#3a2a18" />
                <circle cx={2.5} cy={6.5} r={0.12} fill="#3a2a18" />
                <circle cx={6.5} cy={6.5} r={0.12} fill="#3a2a18" />
              </>
            )}
            {boardSize === 13 && (
              <>
                <circle cx={3.5} cy={3.5} r={0.12} fill="#3a2a18" />
                <circle cx={9.5} cy={3.5} r={0.12} fill="#3a2a18" />
                <circle cx={6.5} cy={6.5} r={0.14} fill="#3a2a18" />
                <circle cx={3.5} cy={9.5} r={0.12} fill="#3a2a18" />
                <circle cx={9.5} cy={9.5} r={0.12} fill="#3a2a18" />
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
                        className={`w-[88%] h-[88%] rounded-full shadow-lg transition-transform flex items-center justify-center ${
                          stone === 'B'
                            ? 'bg-gradient-to-br from-stone-800 to-stone-950 border border-stone-700'
                            : 'bg-gradient-to-br from-white to-stone-200 border border-stone-300'
                        } ${inAtari ? 'ring-2 ring-red-500 animate-pulse' : ''} ${
                          isLastMove ? 'ring-2 ring-amber-400' : ''
                        }`}
                      >
                        {/* Highlight dot for last placed stone */}
                        {isLastMove && (
                          <div className={`w-2 h-2 rounded-full ${stone === 'B' ? 'bg-amber-400' : 'bg-amber-500'} shadow-sm`} />
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

      {/* Bottom Player Indicator (Nero / P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#1c1917"
        pieceIcon={<div className="w-2.5 h-2.5 rounded-full bg-stone-900 ring-1 ring-white/40" />}
        isCurrentTurn={gameState.turn === 'B' && !gameState.gameOver}
        isFlipped={false}
        score={`Catturate: ${gameState.capturedW}`}
        actionButton={
          gameState.turn === 'B' && !gameState.gameOver && !isBotThinking ? (
            <button
              onClick={handlePass}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md active:translate-y-0.5 uppercase tracking-wider flex items-center gap-1"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Passa</span>
            </button>
          ) : undefined
        }
      />

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
