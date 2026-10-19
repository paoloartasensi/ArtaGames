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
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
import { GridSlidePiece } from '../../utils/animations';
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

  const lastMove = gameState.lastMove;
  const fromRC = lastMove ? cellRowCol(lastMove.from) : null;
  const toRC = lastMove ? cellRowCol(lastMove.to) : null;

  const tokenDiv = (player: 0 | 1) => (
    <div
      className="w-3 h-3.5 sm:w-4 sm:h-[18px]"
      style={{
        clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
        backgroundColor: player === 0 ? '#3b82f6' : '#f43f5e',
        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))',
      }}
    />
  );

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-2">
      {/* Top Player Indicator (Rosso / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#f43f5e"
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Casella ${gameState.positions[1]}`}
        actionButton={
          playMode === 'local_pvp' && gameState.turn === 1 && !gameState.gameOver ? (
            <button
              onClick={handleRoll}
              disabled={isBotThinking}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 border-b-2 border-rose-800 text-white font-black text-xs shadow-md active:translate-y-0.5 active:border-b-0 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Dices className="w-4 h-4" />
              <span>TIRA</span>
            </button>
          ) : undefined
        }
      />

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
                  className="relative rounded-[4px] flex items-start justify-start"
                  style={{ backgroundColor: (r + c) % 2 === 0 ? CELL_A : CELL_B }}
                >
                  <span className="text-[8px] sm:text-[10px] font-bold leading-none p-0.5" style={{ color: CELL_TEXT }}>
                    {n}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center gap-1">
                    {p1Here && !(lastMove?.player === 0 && n === lastMove.to) && tokenDiv(0)}
                    {p2Here && !(lastMove?.player === 1 && n === lastMove.to) && tokenDiv(1)}
                  </div>
                  {lastMove?.player === 0 && p1Here && n === lastMove.to && fromRC && toRC && (
                    <GridSlidePiece fromRow={fromRC.row} fromCol={fromRC.col} toRow={toRC.row} toCol={toRC.col}>
                      {tokenDiv(0)}
                    </GridSlidePiece>
                  )}
                  {lastMove?.player === 1 && p2Here && n === lastMove.to && fromRC && toRC && (
                    <GridSlidePiece fromRow={fromRC.row} fromCol={fromRC.col} toRow={toRC.row} toCol={toRC.col}>
                      {tokenDiv(1)}
                    </GridSlidePiece>
                  )}
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

      {/* Center dice roll indicator */}
      {gameState.dice && (
        <div className="my-1.5 flex items-center gap-2 px-3 py-1 bg-white/80 dark:bg-black/50 rounded-xl border border-stone-800 text-xs font-black shadow-sm">
          <span>Ultimo lancio:</span>
          <span className="text-base text-amber-500 font-black">🎲 {gameState.dice}</span>
        </div>
      )}

      {/* Bottom Player Indicator (Blu / P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        isCurrentTurn={gameState.turn === 0 && !gameState.gameOver}
        isFlipped={false}
        score={`Casella ${gameState.positions[0]}`}
        actionButton={
          gameState.turn === 0 && !gameState.gameOver && !isBotThinking ? (
            <button
              onClick={handleRoll}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 border-b-2 border-blue-800 text-white font-black text-xs shadow-md active:translate-y-0.5 active:border-b-0 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Dices className="w-4 h-4" />
              <span>TIRA</span>
            </button>
          ) : undefined
        }
      />

      {isBotThinking && (
        <div className="mt-2 text-xs font-medium text-amber-500 animate-pulse">
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
