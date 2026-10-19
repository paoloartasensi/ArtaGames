import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  DotsBoxesState,
  DBEdge,
  createInitialDotsBoxesState,
  drawEdge,
  getBotDotsBoxesEdge,
} from './dotsboxesEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface DotsBoxesGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const S = 100; // spacing between dots
const M = 58; // margin
const P_COLORS = ['#3B82F6', '#F59E0B'];

export const DotsBoxesGame: React.FC<DotsBoxesGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gridSize, setGridSize] = useState<number>(4);
  const [gameState, setGameState] = useState<DotsBoxesState>(() => createInitialDotsBoxesState(4));
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT turn
  useEffect(() => {
    if (playMode !== 'bot' || gameState.gameOver) return;
    if (gameState.turn !== 1) return;
    setIsBotThinking(true);
    const t = setTimeout(() => {
      const edge = getBotDotsBoxesEdge(gameState, difficulty);
      const next = drawEdge(gameState, edge);
      if (next) {
        sound.playMove();
        setGameState(next);
      }
      setIsBotThinking(false);
    }, 550);
    return () => clearTimeout(t);
  }, [gameState, playMode, difficulty]);

  const isHumanTurn = playMode !== 'bot' || gameState.turn === 0;

  const handleEdge = (edge: DBEdge) => {
    if (gameState.gameOver || isBotThinking) return;
    if (!isHumanTurn) return;
    const next = drawEdge(gameState, edge);
    if (next) {
      sound.playMove();
      setGameState(next);
    }
  };

  const handleRestart = (newSize?: number) => {
    const s = newSize ?? gridSize;
    if (newSize) setGridSize(newSize);
    setGameState(createInitialDotsBoxesState(s));
  };

  const grid = gameState.size;
  const svgSize = M * 2 + (grid - 1) * S;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-2">
      {/* Grid size toggle */}
      <div className="flex items-center justify-center w-full mb-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10">
          {[3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => handleRestart(n)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                gridSize === n ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {n}×{n}
            </button>
          ))}
        </div>
      </div>

      {/* Turn bar with scores */}
      <div className="flex items-center justify-between w-full mb-3 px-1 gap-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all flex-1 ${
            gameState.turn === 0 && !gameState.gameOver ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'opacity-70'
          }`}
        >
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: P_COLORS[0] }} />
          <span className="text-xs font-semibold">{playMode === 'bot' ? 'Tu' : 'Giocatore 1'}</span>
          <span className="ml-auto font-bold text-blue-500">{gameState.scores[0]}</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all flex-1 ${
            gameState.turn === 1 && !gameState.gameOver ? 'ring-2 ring-amber-500 bg-amber-500/10' : 'opacity-70'
          }`}
        >
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: P_COLORS[1] }} />
          <span className="text-xs font-semibold">{playMode === 'bot' ? 'BOT' : 'Giocatore 2'}</span>
          <span className="ml-auto font-bold text-amber-500">{gameState.scores[1]}</span>
        </div>
      </div>

      {/* Board */}
      <div
        className={`w-full rounded-3xl p-2 sm:p-3 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: theme.boardBg }}
      >
        <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full h-auto block select-none">
          {/* Owned boxes */}
          {gameState.boxes.map((owner, idx) => {
            if (owner === null) return null;
            const r = Math.floor(idx / grid);
            const c = idx % grid;
            const x = M + c * S;
            const y = M + r * S;
            const isLast = gameState.lastBox !== null && gameState.lastBox.r === r && gameState.lastBox.c === c;
            return (
              <g key={`b${idx}`}>
                <rect x={x + 6} y={y + 6} width={S - 12} height={S - 12} rx={14} fill={P_COLORS[owner]} opacity={0.35} />
                <circle cx={x + S / 2} cy={y + S / 2} r={15} fill={P_COLORS[owner]} />
                {isLast && (
                  <rect x={x + 6} y={y + 6} width={S - 12} height={S - 12} rx={14} fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.7} />
                )}
              </g>
            );
          })}

          {/* Horizontal edges */}
          {Array.from({ length: grid + 1 }).map((_, r) =>
            Array.from({ length: grid }).map((_, c) => {
              const x1 = M + c * S;
              const y1 = M + r * S;
              const x2 = M + (c + 1) * S;
              const drawn = gameState.hEdges[r][c];
              if (drawn) {
                return (
                  <line key={`h${r}-${c}`} x1={x1} y1={y1} x2={x2} y2={y1} stroke={theme.boardGrid} strokeWidth={7} strokeLinecap="round" />
                );
              }
              const active = !gameState.gameOver && !isBotThinking && isHumanTurn;
              return (
                <g key={`h${r}-${c}`} onClick={() => handleEdge({ kind: 'h', r, c })} className={active ? 'cursor-pointer' : ''}>
                  <line x1={x1} y1={y1} x2={x2} y2={y1} stroke="transparent" strokeWidth={30} />
                  <line x1={x1} y1={y1} x2={x2} y2={y1} stroke={theme.boardGrid} strokeWidth={5} strokeDasharray="9 11" opacity={0.4} />
                </g>
              );
            }),
          )}

          {/* Vertical edges */}
          {Array.from({ length: grid }).map((_, r) =>
            Array.from({ length: grid + 1 }).map((_, c) => {
              const x1 = M + c * S;
              const y1 = M + r * S;
              const y2 = M + (r + 1) * S;
              const drawn = gameState.vEdges[r][c];
              if (drawn) {
                return (
                  <line key={`v${r}-${c}`} x1={x1} y1={y1} x2={x1} y2={y2} stroke={theme.boardGrid} strokeWidth={7} strokeLinecap="round" />
                );
              }
              const active = !gameState.gameOver && !isBotThinking && isHumanTurn;
              return (
                <g key={`v${r}-${c}`} onClick={() => handleEdge({ kind: 'v', r, c })} className={active ? 'cursor-pointer' : ''}>
                  <line x1={x1} y1={y1} x2={x1} y2={y2} stroke="transparent" strokeWidth={30} />
                  <line x1={x1} y1={y1} x2={x1} y2={y2} stroke={theme.boardGrid} strokeWidth={5} strokeDasharray="9 11" opacity={0.4} />
                </g>
              );
            }),
          )}

          {/* Dots */}
          {Array.from({ length: grid + 1 }).map((_, r) =>
            Array.from({ length: grid + 1 }).map((_, c) => (
              <circle key={`d${r}-${c}`} cx={M + c * S} cy={M + r * S} r={6} fill={theme.boardGrid} />
            )),
          )}
        </svg>
      </div>

      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse">Il BOT sta disegnando...</div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Pareggio!'
            : gameState.winner === 0
            ? playMode === 'bot'
              ? 'Hai vinto! 🎉'
              : 'Vince il Giocatore 1! 🎉'
            : playMode === 'bot'
            ? 'Vince il BOT!'
            : 'Vince il Giocatore 2! 🎉'
        }
        winnerSubtitle={`Punteggio finale: ${gameState.scores[0]} a ${gameState.scores[1]}`}
        isDraw={gameState.winner === 'draw'}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
