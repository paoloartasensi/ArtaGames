import React, { useEffect, useState } from 'react';
import { PlayMode } from '../../types/game';
import {
  SnakesState,
  createInitialSnakesState,
  rollSnakesMove,
  SNAKES_AND_LADDERS,
  isLadder,
  cellRowCol,
  BOARD_SIZE,
} from './snakesEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { Dices } from 'lucide-react';

interface SnakesGameProps {
  playMode: PlayMode;
  difficulty: unknown;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const CELL_A = '#f7f2e7';
const CELL_B = '#eae0cb';
const CELL_TEXT = '#57534e';

export const SnakesGame: React.FC<SnakesGameProps> = ({
  playMode,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<SnakesState>(createInitialSnakesState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  const grid: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (let n = 1; n <= BOARD_SIZE; n++) {
    const { row, col } = cellRowCol(n);
    grid[row][col] = n;
  }

  const connections = Object.entries(SNAKES_AND_LADDERS).map(([from, to]) => ({
    from: Number(from),
    to: Number(to),
  }));

  const center = (n: number) => {
    const { row, col } = cellRowCol(n);
    return { x: col + 0.5, y: row + 0.5 };
  };

  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 1 && !gameState.gameOver) {
      setIsBotThinking(true);
      const t = setTimeout(() => {
        const next = rollSnakesMove(gameState);
        if (next) {
          sound.playMove();
          setGameState(next);
        }
        setIsBotThinking(false);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [gameState, playMode]);

  const handleRoll = () => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    const next = rollSnakesMove(gameState);
    if (next) {
      sound.playMove();
      setGameState(next);
    }
  };

  const handleRestart = () => setGameState(createInitialSnakesState());

  const p1Name = 'Blu (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Rosso (BOT)' : 'Rosso (Giocatore 2)';

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-2">
      {/* Turn indicator */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 0 && !gameState.gameOver ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'opacity-70'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-xs font-semibold">{p1Name}</span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 1 && !gameState.gameOver ? 'ring-2 ring-rose-500 bg-rose-500/10' : 'opacity-70'
          }`}
        >
          <span className="text-xs font-semibold">{p2Name}</span>
          <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm" />
        </div>
      </div>

      {/* Board */}
      <div
        className={`relative w-full aspect-square rounded-3xl shadow-xl p-2 sm:p-3 transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: gameState.gameOver ? theme.boardBg : getTurnColor(gameState.turn, playMode) }}
      >
        <div className="grid grid-cols-10 grid-rows-10 gap-0.5 h-full w-full">
          {grid.map((row, r) =>
            row.map((n, c) => {
              const p1Here = gameState.positions[0] === n;
              const p2Here = gameState.positions[1] === n;
              return (
                <div
                  key={n}
                  className="relative rounded-[4px] flex items-start justify-start overflow-hidden"
                  style={{ backgroundColor: (r + c) % 2 === 0 ? CELL_A : CELL_B }}
                >
                  <span className="text-[8px] sm:text-[10px] font-bold leading-none p-0.5" style={{ color: CELL_TEXT }}>
                    {n}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                    {p1Here && <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-blue-500 ring-2 ring-white shadow" />}
                    {p2Here && <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-rose-500 ring-2 ring-white shadow" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Snakes & ladders overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 10 10" preserveAspectRatio="none">
          {connections.map(({ from, to }) => {
            const a = center(from);
            const b = center(to);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy);
            const ux = dx / len;
            const uy = dy / len;
            const px = -uy;
            const py = ux;

            if (isLadder(from)) {
              const rungs = [];
              for (let t = 0.1; t < 0.95; t += 0.12) {
                const mx = a.x + dx * t;
                const my = a.y + dy * t;
                rungs.push(
                  <line
                    key={`r${from}-${t}`}
                    x1={mx + px * 0.1}
                    y1={my + py * 0.1}
                    x2={mx - px * 0.1}
                    y2={my - py * 0.1}
                    stroke="#16a34a"
                    strokeWidth="0.05"
                    strokeLinecap="round"
                  />
                );
              }
              return (
                <g key={from}>
                  <line x1={a.x + px * 0.1} y1={a.y + py * 0.1} x2={b.x + px * 0.1} y2={b.y + py * 0.1} stroke="#16a34a" strokeWidth="0.04" strokeLinecap="round" />
                  <line x1={a.x - px * 0.1} y1={a.y - py * 0.1} x2={b.x - px * 0.1} y2={b.y - py * 0.1} stroke="#16a34a" strokeWidth="0.04" strokeLinecap="round" />
                  {rungs}
                </g>
              );
            }

            let d = '';
            const steps = 26;
            for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const x = a.x + dx * t + px * Math.sin(t * Math.PI * 4) * 0.11;
              const y = a.y + dy * t + py * Math.sin(t * Math.PI * 4) * 0.11;
              d += `${i === 0 ? 'M' : 'L'}${x.toFixed(3)} ${y.toFixed(3)} `;
            }
            return (
              <g key={from}>
                <path d={d} fill="none" stroke="#dc2626" strokeWidth="0.07" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={b.x} cy={b.y} r="0.13" fill="#dc2626" />
                <circle cx={b.x} cy={b.y} r="0.05" fill="#fff" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dice + roll button */}
      <div className="mt-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/10 shadow-inner flex items-center justify-center text-3xl font-black border border-black/10 dark:border-white/10">
          {gameState.dice ?? '·'}
        </div>
        <button
          onClick={handleRoll}
          disabled={gameState.gameOver || isBotThinking || (playMode === 'bot' && gameState.turn === 1)}
          className="px-6 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-lg shadow-lg shadow-amber-600/20 transition-transform active:scale-95 disabled:opacity-40 flex items-center gap-2"
        >
          <Dices className="w-6 h-6" />
          <span>Lancia il dado</span>
        </button>
      </div>

      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse">
          Il BOT sta lanciando il dado...
        </div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 0
            ? 'Vince il Blu! 🎉'
            : 'Vince il Rosso! 🎉'
        }
        winnerSubtitle={
          gameState.winner === 0
            ? playMode === 'bot'
              ? 'Bravissimo! Hai raggiunto la casella 100!'
              : 'Complimenti al Giocatore 1, in cima alla scala!'
            : playMode === 'bot'
            ? 'Il BOT è arrivato a 100. Rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
