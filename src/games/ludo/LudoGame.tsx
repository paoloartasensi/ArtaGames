import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  LudoState,
  createInitialLudoState,
  rollLudo,
  moveLudo,
  getBotLudoMove,
  TRACK,
  START_INDEX,
  HOME_COLUMNS,
  STAR_CELLS,
  FINISH_POS,
} from './ludoEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { Dices } from 'lucide-react';

interface LudoGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

// Base slots for the 4 tokens of each player, as [row, col] cells.
const BASE_SLOTS: [number, number][][] = [
  [[10, 10], [10, 12], [12, 10], [12, 12]], // Blu (bottom-right)
  [[1, 1], [1, 3], [3, 1], [3, 3]], // Rosso (top-left)
];

// Spread applied when several tokens of the same player share a cell (SVG units).
const STACK_OFFSETS = [
  { dx: -0.26, dy: -0.26 },
  { dx: 0.26, dy: -0.26 },
  { dx: -0.26, dy: 0.26 },
  { dx: 0.26, dy: 0.26 },
];

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// Palette (vibrant, kid-friendly, readable in every theme).
const C = {
  track: '#ffffff',
  base0: '#bfdbfe', // Blu base (light)
  base1: '#fecdd3', // Rosso base (light)
  baseEmpty: '#ece4d2',
  home0: '#93c5fd', // Blu home column
  home1: '#fda4af', // Rosso home column
  start0: '#60a5fa', // Blu start cell
  start1: '#fb7185', // Rosso start cell
  star: '#fbbf24', // safe star cell
  centerBg: '#f5efe3',
  center0: '#60a5fa', // Blu centre triangle
  center1: '#fb7185', // Rosso centre triangle
  token0: '#1d4ed8', // Blu token (dark)
  token1: '#be123c', // Rosso token (dark)
};

const DiceFace: React.FC<{ value: number | null }> = ({ value }) => {
  const pips = value ? PIPS[value] : [];
  return (
    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/10 shadow-inner border border-black/10 dark:border-white/10 grid grid-cols-3 grid-rows-3 p-2.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {pips.includes(i) && <div className="w-2 h-2 rounded-full bg-stone-800 dark:bg-white" />}
        </div>
      ))}
    </div>
  );
};

export const LudoGame: React.FC<LudoGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<LudoState>(createInitialLudoState());
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [animDice, setAnimDice] = useState<number | null>(null); // face shown while the die is "rolling"

  const frame = theme.boardBg;

  // Colour scheme: blue = Giocatore 1, red = Giocatore 2, yellow = BOT.
  const botYellow = playMode === 'bot';
  const base1 = botYellow ? '#fde68a' : C.base1;
  const home1 = botYellow ? '#fcd34d' : C.home1;
  const start1 = botYellow ? '#fbbf24' : C.start1;
  const center1 = botYellow ? '#fbbf24' : C.center1;
  const token1 = botYellow ? '#a16207' : C.token1;
  const p2Ring = botYellow ? 'ring-amber-500 bg-amber-500/10' : 'ring-rose-500 bg-rose-500/10';
  const p2Dot = botYellow ? 'bg-amber-500' : 'bg-rose-500';
  // Board background tint shows whose turn it is at a glance.
  const turnColor = gameState.gameOver
    ? theme.boardBg
    : gameState.turn === 0
    ? '#3b82f6'
    : botYellow
    ? '#f59e0b'
    : '#ef4444';

  // Bot turn: animate the die, then roll, then pick a token to move.
  useEffect(() => {
    if (playMode !== 'bot' || gameState.turn !== 1 || gameState.gameOver) return;

    setIsBotThinking(true);

    if (gameState.phase === 'roll') {
      // Animate a rolling die before committing the roll.
      let face = 1;
      const interval = setInterval(() => {
        face = (face % 6) + 1;
        setAnimDice(face);
      }, 90);
      const t = setTimeout(() => {
        clearInterval(interval);
        setAnimDice(null);
        const next = rollLudo(gameState);
        if (next) {
          sound.playMove();
          setGameState(next);
        }
        setIsBotThinking(false);
      }, 560);
      return () => {
        clearInterval(interval);
        clearTimeout(t);
      };
    }

    const t = setTimeout(() => {
      const idx = getBotLudoMove(gameState, difficulty);
      const next = moveLudo(gameState, idx);
      if (next) {
        if (next.lastMove?.captured) sound.playCapture();
        else if (next.lastMove?.finished) sound.playMove();
        else sound.playStone();
        setGameState(next);
      }
      setIsBotThinking(false);
    }, 700);
    return () => clearTimeout(t);
  }, [gameState, playMode, difficulty]);

  const handleRoll = () => {
    if (gameState.gameOver || isBotThinking || animDice !== null) return;
    if (gameState.phase !== 'roll') return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    setAnimDice(1 + Math.floor(Math.random() * 6));
    const interval = setInterval(() => {
      setAnimDice(1 + Math.floor(Math.random() * 6));
    }, 90);
    setTimeout(() => {
      clearInterval(interval);
      setAnimDice(null);
      const next = rollLudo(gameState);
      if (next) {
        sound.playMove();
        setGameState(next);
      }
    }, 480);
  };

  const handleTokenClick = (player: 0 | 1, tokenIndex: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (gameState.phase !== 'move') return;
    if (gameState.turn !== player) return;
    if (playMode === 'bot' && player === 1) return;
    if (!gameState.movable.includes(tokenIndex)) return;
    const next = moveLudo(gameState, tokenIndex);
    if (next) {
      if (next.lastMove?.captured) sound.playCapture();
      else if (next.lastMove?.finished) sound.playMove();
      else sound.playStone();
      setGameState(next);
    }
  };

  const handleRestart = () => setGameState(createInitialLudoState());

  // --- Token positions, in SVG units (0..15) so they align with the cells ---
  const tokenXY = (p: 0 | 1, i: number, pos: number): { x: number; y: number } => {
    let r: number;
    let c: number;
    if (pos === -1) {
      [r, c] = BASE_SLOTS[p][i];
    } else if (pos === FINISH_POS) {
      r = p === 0 ? 8 : 6;
      c = p === 0 ? 8 : 6;
    } else if (pos <= 50) {
      [r, c] = TRACK[(START_INDEX[p] + pos) % 52];
    } else {
      [r, c] = HOME_COLUMNS[p][pos - 51];
    }
    return { x: c + 0.5, y: r + 0.5 };
  };

  const rawTokens: { player: 0 | 1; tokenIndex: number; x: number; y: number }[] = [];
  (([0, 1]) as (0 | 1)[]).forEach((p) => {
    for (let i = 0; i < 4; i++) {
      const xy = tokenXY(p, i, gameState.tokens[p][i]);
      rawTokens.push({ player: p, tokenIndex: i, ...xy });
    }
  });

  const counts = new Map<string, number>();
  rawTokens.forEach((t) => {
    const k = `${t.player}:${t.x.toFixed(2)}:${t.y.toFixed(2)}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  });
  const seen = new Map<string, number>();

  const renderedTokens = rawTokens.map((t) => {
    const k = `${t.player}:${t.x.toFixed(2)}:${t.y.toFixed(2)}`;
    let dx = 0;
    let dy = 0;
    if ((counts.get(k) || 0) > 1) {
      const order = seen.get(k) || 0;
      seen.set(k, order + 1);
      const off = STACK_OFFSETS[order % 4];
      dx = off.dx;
      dy = off.dy;
    }
    return {
      ...t,
      x: t.x + dx,
      y: t.y + dy,
      movable:
        gameState.phase === 'move' &&
        gameState.turn === t.player &&
        gameState.movable.includes(t.tokenIndex),
      isLastMoved:
        gameState.lastMove !== null &&
        gameState.lastMove.player === t.player &&
        gameState.lastMove.token === t.tokenIndex,
    };
  });

  const p1Name = 'Blu (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Giallo (BOT)' : 'Rosso (Giocatore 2)';

  const canRoll =
    gameState.phase === 'roll' &&
    !gameState.gameOver &&
    !isBotThinking &&
    animDice === null &&
    !(playMode === 'bot' && gameState.turn === 1);

  const lastMove = gameState.lastMove;
  const statusText = gameState.gameOver
    ? ''
    : gameState.message
    ? gameState.message
    : isBotThinking
    ? gameState.dice !== null
      ? `Il BOT ha lanciato un ${gameState.dice}!`
      : 'Il BOT sta lanciando il dado...'
    : gameState.phase === 'move'
    ? playMode === 'bot' && gameState.turn === 1
      ? 'Il BOT sta scegliendo una pedina...'
      : 'Tocca una pedina illuminata per muoverla!'
    : lastMove && lastMove.extraTurn && lastMove.player === gameState.turn
    ? lastMove.captured > 0
      ? '🍽️ Mangiato! Lancia ancora il dado!'
      : '🎲 Sei uscito con un 6: lancia ancora!'
    : 'Premi "Lancia il dado" per giocare';

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-2">
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
            gameState.turn === 1 && !gameState.gameOver ? `ring-2 ${p2Ring}` : 'opacity-70'
          }`}
        >
          <span className="text-xs font-semibold">{p2Name}</span>
          <div className={`w-4 h-4 rounded-full shadow-sm ${p2Dot}`} />
        </div>
      </div>

      {/* Board */}
      <div
        className={`relative w-full aspect-square rounded-3xl shadow-xl overflow-hidden p-1.5 sm:p-2 transition-all ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: turnColor }}
      >
        <svg viewBox="0 0 15 15" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
          {/* Corner bases */}
          <rect x="0" y="0" width="6" height="6" fill={base1} stroke={frame} strokeWidth="0.06" />
          <rect x="9" y="0" width="6" height="6" fill={C.baseEmpty} stroke={frame} strokeWidth="0.06" />
          <rect x="0" y="9" width="6" height="6" fill={C.baseEmpty} stroke={frame} strokeWidth="0.06" />
          <rect x="9" y="9" width="6" height="6" fill={C.base0} stroke={frame} strokeWidth="0.06" />

          {/* Centre home area */}
          <rect x="6" y="6" width="3" height="3" fill={C.centerBg} stroke={frame} strokeWidth="0.06" />
          <polygon points="6,6 9,6 6,9" fill={center1} />
          <polygon points="9,9 6,9 9,6" fill={C.center0} />

          {/* Track cells */}
          {TRACK.map(([r, c], i) => {
            let fill = C.track;
            if (STAR_CELLS.has(i)) fill = C.star;
            else if (START_INDEX[0] === i) fill = C.start0;
            else if (START_INDEX[1] === i) fill = start1;
            return (
              <rect
                key={i}
                x={c}
                y={r}
                width="1"
                height="1"
                fill={fill}
                stroke={frame}
                strokeWidth="0.06"
              />
            );
          })}

          {/* Home columns */}
          {HOME_COLUMNS.map((cells, p) =>
            cells.map(([r, c], j) => (
              <rect
                key={`h${p}-${j}`}
                x={c}
                y={r}
                width="1"
                height="1"
                fill={p === 0 ? C.home0 : home1}
                stroke={frame}
                strokeWidth="0.06"
              />
            ))
          )}

          {/* Star glyphs */}
          {[...STAR_CELLS].map((i) => {
            const [r, c] = TRACK[i];
            return (
              <text
                key={`star${i}`}
                x={c + 0.5}
                y={r + 0.5}
                fontSize="0.52"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontWeight="bold"
              >
                ★
              </text>
            );
          })}

          {/* Start markers (white dot) */}
          {[0, 1].map((p) => {
            const [r, c] = TRACK[START_INDEX[p]];
            return (
              <circle
                key={`start${p}`}
                cx={c + 0.5}
                cy={r + 0.5}
                r="0.16"
                fill="#ffffff"
              />
            );
          })}

          {/* Base home slots */}
          {BASE_SLOTS.map((slots, p) =>
            slots.map(([r, c], j) => (
              <circle
                key={`slot${p}-${j}`}
                cx={c + 0.5}
                cy={r + 0.5}
                r="0.44"
                fill="#ffffff"
                fillOpacity="0.85"
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="0.04"
              />
            ))
          )}

          {/* Tokens */}
          {renderedTokens.map((t) => {
            const fill = t.player === 0 ? C.token0 : token1;
            return (
              <g
                key={`${t.player}-${t.tokenIndex}`}
                onClick={() => handleTokenClick(t.player, t.tokenIndex)}
                style={{ cursor: t.movable ? 'pointer' : 'default' }}
              >
                <circle cx={t.x + 0.06} cy={t.y + 0.1} r="0.4" fill="rgba(0,0,0,0.28)" />
                <circle cx={t.x} cy={t.y} r="0.4" fill={fill} stroke="#ffffff" strokeWidth="0.08" />
                {t.isLastMoved && (
                  <circle cx={t.x} cy={t.y} r="0.5" fill="none" stroke="#f59e0b" strokeWidth="0.12" />
                )}
                {t.movable && (
                  <circle
                    cx={t.x}
                    cy={t.y}
                    r="0.52"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="0.1"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dice + roll button */}
      <div className="mt-4 flex items-center gap-4">
        <DiceFace value={gameState.dice} />
        <button
          onClick={handleRoll}
          disabled={!canRoll}
          className="px-6 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-lg shadow-lg shadow-amber-600/20 transition-transform active:scale-95 disabled:opacity-40 flex items-center gap-2"
        >
          <Dices className="w-6 h-6" />
          <span>Lancia il dado</span>
        </button>
      </div>

      <p className="mt-3 text-[11px] text-center font-medium text-stone-500 dark:text-stone-400 max-w-xs min-h-[2.5rem]">
        {statusText}
      </p>

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={gameState.winner === 0 ? 'Vince il Blu! 🎉' : 'Vince il Rosso! 🎉'}
        winnerSubtitle={
          gameState.winner === 0
            ? playMode === 'bot'
              ? 'Bravissimo! Hai portato a casa tutte le pedine!'
              : 'Complimenti al Giocatore 1, tutte le pedine a casa!'
            : playMode === 'bot'
            ? 'Il BOT ha portato a casa tutte le pedine. Rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
