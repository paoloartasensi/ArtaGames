import React, { useEffect, useRef, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  LudoState,
  createInitialLudoState,
  rollLudo,
  moveLudo,
  getBotLudoMove,
  movesAreEquivalent,
  TRACK,
  START_INDEX,
  HOME_COLUMNS,
  FINISH_POS,
} from './ludoEngine';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { InGameMenuModal } from '../../components/InGameMenuModal';
import { ScorePill } from '../../components/ScorePill';
import { Sparkles } from 'lucide-react';

interface LudoGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

// Corner bases:
// Blue (Player 0) = top-right (col 9..14, row 0..5)
// Red (Player 1) = bottom-left (col 0..5, row 9..14)
const BASE_SLOTS: [number, number][][] = [
  [[1.8, 10.8], [1.8, 13.2], [4.2, 10.8], [4.2, 13.2]], // Player 0 (Blue)
  [[10.8, 1.8], [10.8, 4.2], [13.2, 1.8], [13.2, 4.2]], // Player 1 (Red)
];

const STACK_OFFSETS = [
  { dx: -0.25, dy: -0.25 },
  { dx: 0.25, dy: -0.25 },
  { dx: -0.25, dy: 0.25 },
  { dx: 0.25, dy: 0.25 },
];

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const MiniDice: React.FC<{ value: number }> = ({ value }) => {
  const pips = PIPS[value] || [];
  return (
    <div className="w-8 h-8 rounded-lg bg-white shadow-inner border border-stone-800 grid grid-cols-3 grid-rows-3 p-1">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {pips.includes(i) && <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />}
        </div>
      ))}
    </div>
  );
};

/**
 * Pawn positioned with a plain SVG transform attribute (CSS transforms on SVG are unreliable
 * on old Safari), sliding to its new place with a small requestAnimationFrame tween.
 */
const AnimatedPawn: React.FC<{ x: number; y: number; onTap: () => void; movable: boolean; children: React.ReactNode }> = ({
  x,
  y,
  onTap,
  movable,
  children,
}) => {
  const [pos, setPos] = useState({ x, y });
  const posRef = useRef({ x, y });

  useEffect(() => {
    const from = { ...posRef.current };
    if (from.x === x && from.y === y) return;
    const start = Date.now();
    const DURATION = 260;
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / DURATION);
      const e = 1 - (1 - t) * (1 - t);
      const next = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
      posRef.current = next;
      setPos(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [x, y]);

  return (
    <g transform={`translate(${pos.x} ${pos.y})`} onClick={onTap} style={{ cursor: movable ? 'pointer' : 'default' }}>
      {/* Big invisible touch target, much easier for small fingers than the pawn itself */}
      <circle cx="0" cy="0" r={movable ? 0.75 : 0.45} fill="rgba(0,0,0,0)" />
      {children}
    </g>
  );
};

export const LudoGame: React.FC<LudoGameProps> = ({
  playMode,
  difficulty,
  onOpenRules,
  onSelectGame,
  isTabletFlipped,
}) => {
  const [gameState, setGameState] = useState<LudoState>(createInitialLudoState());
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [animDice, setAnimDice] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const rollingRef = useRef(false);

  const applyMove = (next: LudoState) => {
    if (next.lastMove?.captured) sound.playCapture();
    else if (next.lastMove?.finished) sound.playMove();
    else sound.playStone();
    setGameState(next);
  };

  // Bot logic
  useEffect(() => {
    if (playMode !== 'bot' || gameState.turn !== 1 || gameState.gameOver) return;

    setIsBotThinking(true);

    if (gameState.phase === 'roll') {
      let face = 1;
      // Give the human time to read the last message before the bot throws
      const wait = gameState.message ? 1400 : 700;
      let interval: ReturnType<typeof setInterval> | null = null;
      const t0 = setTimeout(() => {
        interval = setInterval(() => {
          face = (face % 6) + 1;
          setAnimDice(face);
        }, 90);
      }, wait - 500);

      const t = setTimeout(() => {
        if (interval) clearInterval(interval);
        setAnimDice(null);
        const next = rollLudo(gameState);
        if (next) {
          sound.playMove();
          setGameState(next);
        }
        setIsBotThinking(false);
      }, wait);

      return () => {
        clearTimeout(t0);
        if (interval) clearInterval(interval);
        clearTimeout(t);
        setAnimDice(null);
        setIsBotThinking(false);
      };
    }

    const t = setTimeout(() => {
      const idx = getBotLudoMove(gameState, difficulty);
      const next = moveLudo(gameState, idx);
      if (next) applyMove(next);
      setIsBotThinking(false);
    }, 700);

    return () => {
      clearTimeout(t);
      setIsBotThinking(false);
    };
  }, [gameState, playMode, difficulty]);

  // Human turn: when every choice gives the same result (only one pawn can move, or all
  // movable pawns are still in base) move it automatically so the game never feels stuck.
  useEffect(() => {
    if (gameState.gameOver || gameState.phase !== 'move') return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    if (!movesAreEquivalent(gameState)) return;
    const t = setTimeout(() => {
      const next = moveLudo(gameState, gameState.movable[0]);
      if (next) applyMove(next);
    }, 650);
    return () => clearTimeout(t);
  }, [gameState, playMode]);

  const handleRoll = () => {
    if (gameState.gameOver || isBotThinking || animDice !== null || rollingRef.current) return;
    if (gameState.phase !== 'roll') return;
    if (playMode === 'bot' && gameState.turn === 1) return;

    rollingRef.current = true;
    setAnimDice(1 + Math.floor(Math.random() * 6));
    const interval = setInterval(() => {
      setAnimDice(1 + Math.floor(Math.random() * 6));
    }, 90);

    setTimeout(() => {
      clearInterval(interval);
      setAnimDice(null);
      rollingRef.current = false;
      const next = rollLudo(gameState);
      if (next) {
        sound.playMove();
        setGameState(next);
      }
    }, 450);
  };

  const handleTokenClick = (player: 0 | 1, tokenIndex: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (gameState.phase !== 'move') return;
    if (gameState.turn !== player) return;
    if (playMode === 'bot' && player === 1) return;
    if (!gameState.movable.includes(tokenIndex)) return;

    const next = moveLudo(gameState, tokenIndex);
    if (next) applyMove(next);
  };

  const handleRestart = () => {
    setGameState(createInitialLudoState());
  };

  // Coordinates in SVG 0..15 space
  const tokenXY = (p: 0 | 1, i: number, pos: number): { x: number; y: number } => {
    if (pos === -1) {
      const [r, c] = BASE_SLOTS[p][i];
      return { x: c, y: r };
    }
    if (pos === FINISH_POS) {
      return { x: 7.5, y: 7.5 };
    }
    if (pos <= 50) {
      const [r, c] = TRACK[(START_INDEX[p] + pos) % 52];
      return { x: c + 0.5, y: r + 0.5 };
    }
    const [r, c] = HOME_COLUMNS[p][pos - 51];
    return { x: c + 0.5, y: r + 0.5 };
  };

  const rawTokens: { player: 0 | 1; tokenIndex: number; x: number; y: number }[] = [];
  ([0, 1] as (0 | 1)[]).forEach((p) => {
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

  const p1Score = gameState.tokens[0].filter((p) => p === FINISH_POS).length;
  const p2Score = gameState.tokens[1].filter((p) => p === FINISH_POS).length;

  const diceButtonContent = (p: 0 | 1) => {
    if (animDice !== null && gameState.turn === p) {
      return <MiniDice value={animDice} />;
    }
    if (gameState.turn === p && gameState.phase === 'move' && gameState.dice) {
      return (
        <div className="flex items-center gap-2">
          <MiniDice value={gameState.dice} />
          <span className="text-xl">{gameState.dice}</span>
        </div>
      );
    }
    const last = gameState.lastRoll && gameState.lastRoll.player === p ? gameState.lastRoll.value : null;
    if (gameState.turn === p) {
      // My turn to throw (again): show what I got last time next to TIRA
      return (
        <div className="flex items-center gap-3">
          {last !== null && <span className="opacity-60"><MiniDice value={last} /></span>}
          <span>TIRA</span>
        </div>
      );
    }
    // Not my turn: keep my last throw visible so I can see why the turn passed
    return last !== null ? (
      <div className="flex items-center gap-2">
        <MiniDice value={last} />
        <span className="text-xl">{last}</span>
      </div>
    ) : (
      <span>TIRA</span>
    );
  };

  const isTopPlayerTurn = gameState.turn === 1 && (playMode === 'local_pvp' || isTabletFlipped);

  return (
    <div className="w-full h-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col items-center justify-between py-4 px-3 select-none">
      {/* Top Player Action Bar (Player 2 or Bot) */}
      <div
        className={`w-full flex items-center justify-center gap-3 transition-transform ${
          playMode === 'local_pvp' || isTabletFlipped ? 'rotate-180' : ''
        }`}
      >
        <button
          onClick={handleRoll}
          disabled={gameState.turn !== 1 || gameState.phase !== 'roll' || playMode === 'bot'}
          className={`h-14 px-8 rounded-2xl border-2 border-stone-800 shadow-lg font-black text-2xl tracking-widest text-white transition-all flex items-center gap-3 ${
            gameState.turn === 1 && gameState.phase === 'roll'
              ? 'bg-[#186b97] hover:bg-[#135a80] active:scale-95'
              : 'bg-[#186b97]/80 opacity-70'
          }`}
        >
          {diceButtonContent(1)}
        </button>

        <button
          onClick={() => setIsMenuOpen(true)}
          className="w-14 h-14 rounded-2xl bg-white hover:bg-stone-100 border-2 border-stone-800 shadow-lg flex items-center justify-center text-[#00b2f6] active:scale-95 transition-transform"
        >
          <Sparkles className="w-7 h-7 fill-current stroke-stone-800 stroke-[1.5]" />
        </button>
      </div>

      {/* Center Board (Aspect-Square, Pixel-Accurate to Offline Games) */}
      <div className="w-full aspect-square max-h-[72vh] my-auto relative rounded-md border-4 border-[#222222] shadow-2xl overflow-hidden bg-white">
        <svg viewBox="0 0 15 15" className="w-full h-full block">
          {/* Top-Left: Yellow Corner Base */}
          <rect x="0" y="0" width="6" height="6" fill="#fbb928" stroke="#222222" strokeWidth="0.08" />
          <rect x="0.8" y="0.8" width="4.4" height="4.4" rx="1.1" fill="#ffd768" />
          {[[1.8, 1.8], [1.8, 4.2], [4.2, 1.8], [4.2, 4.2]].map(([cx, cy], i) => (
            <circle key={`yslot-${i}`} cx={cx} cy={cy} r="0.8" fill="#ffe89c" />
          ))}

          {/* Top-Right: Blue Corner Base (Player 0) */}
          <rect x="9" y="0" width="6" height="6" fill="#00afee" stroke="#222222" strokeWidth="0.08" />
          <rect x="9.8" y="0.8" width="4.4" height="4.4" rx="1.1" fill="#79dcfd" />
          {[[10.8, 1.8], [10.8, 4.2], [13.2, 1.8], [13.2, 4.2]].map(([cx, cy], i) => (
            <circle key={`bslot-${i}`} cx={cx} cy={cy} r="0.8" fill="#d2f3fe" />
          ))}

          {/* Bottom-Left: Red Corner Base (Player 1) */}
          <rect x="0" y="9" width="6" height="6" fill="#ff5757" stroke="#222222" strokeWidth="0.08" />
          <rect x="0.8" y="9.8" width="4.4" height="4.4" rx="1.1" fill="#ffa6a6" />
          {[[1.8, 10.8], [1.8, 13.2], [4.2, 10.8], [4.2, 13.2]].map(([cx, cy], i) => (
            <circle key={`rslot-${i}`} cx={cx} cy={cy} r="0.8" fill="#fed5d5" />
          ))}

          {/* Bottom-Right: Green Corner Base */}
          <rect x="9" y="9" width="6" height="6" fill="#77c738" stroke="#222222" strokeWidth="0.08" />
          <rect x="9.8" y="9.8" width="4.4" height="4.4" rx="1.1" fill="#b6e48c" />
          {[[10.8, 10.8], [10.8, 13.2], [13.2, 10.8], [13.2, 13.2]].map(([cx, cy], i) => (
            <circle key={`gslot-${i}`} cx={cx} cy={cy} r="0.8" fill="#d9f2c3" />
          ))}

          {/* Track Grid Cells (White with dark border) */}
          {TRACK.map(([r, c], i) => (
            <rect
              key={`track-${i}`}
              x={c}
              y={r}
              width="1"
              height="1"
              fill="#ffffff"
              stroke="#222222"
              strokeWidth="0.05"
            />
          ))}

          {/* Colored Home Run Paths to Center */}
          {[1, 2, 3, 4, 5].map((c) => (
            <rect key={`yrun-${c}`} x={c} y={7} width="1" height="1" fill="#fbb928" stroke="#222222" strokeWidth="0.05" />
          ))}
          {[1, 2, 3, 4, 5].map((r) => (
            <rect key={`brun-${r}`} x={7} y={r} width="1" height="1" fill="#00afee" stroke="#222222" strokeWidth="0.05" />
          ))}
          {[9, 10, 11, 12, 13].map((c) => (
            <rect key={`grun-${c}`} x={c} y={7} width="1" height="1" fill="#77c738" stroke="#222222" strokeWidth="0.05" />
          ))}
          {[9, 10, 11, 12, 13].map((r) => (
            <rect key={`rrun-${r}`} x={7} y={r} width="1" height="1" fill="#ff5757" stroke="#222222" strokeWidth="0.05" />
          ))}

          {/* Special Star Cells (Safe Squares) */}
          {/* Yellow Star at [6, 1] */}
          <text x="1.5" y="6.75" fontSize="0.75" textAnchor="middle" fill="#fbb928">★</text>
          {/* Blue Star at [1, 8] */}
          <text x="8.5" y="1.75" fontSize="0.75" textAnchor="middle" fill="#00afee">★</text>
          {/* Green Star at [8, 13] */}
          <text x="13.5" y="8.75" fontSize="0.75" textAnchor="middle" fill="#77c738">★</text>
          {/* Red Star at [13, 6] */}
          <text x="6.5" y="13.75" fontSize="0.75" textAnchor="middle" fill="#ff5757">★</text>

          {/* Entry Arrows */}
          {/* Blue entry arrow pointing down into [1, 8] */}
          <text x="7.5" y="0.8" fontSize="0.7" textAnchor="middle" fill="#79dcfd" fontWeight="bold">↓</text>
          {/* Red entry arrow pointing up into [13, 6] */}
          <text x="7.5" y="14.8" fontSize="0.7" textAnchor="middle" fill="#ffa6a6" fontWeight="bold">↑</text>

          {/* Center Goal Triangles */}
          <rect x="6" y="6" width="3" height="3" fill="#ffffff" stroke="#222222" strokeWidth="0.08" />
          <polygon points="6,6 9,6 7.5,7.5" fill="#00afee" stroke="#222222" strokeWidth="0.06" />
          <polygon points="6,9 9,9 7.5,7.5" fill="#ff5757" stroke="#222222" strokeWidth="0.06" />
          <polygon points="6,6 6,9 7.5,7.5" fill="#fbb928" stroke="#222222" strokeWidth="0.06" />
          <polygon points="9,6 9,9 7.5,7.5" fill="#77c738" stroke="#222222" strokeWidth="0.06" />

          {/* Board Outer Border */}
          <rect x="0" y="0" width="15" height="15" fill="none" stroke="#222222" strokeWidth="0.16" />

          {/* Tokens (2.5D Conical / Pawn style matching Offline Games screenshot) */}
          {renderedTokens.map((t) => {
            const fillColor = t.player === 0 ? '#00afee' : '#ff5757';
            return (
              <AnimatedPawn
                key={`pawn-${t.player}-${t.tokenIndex}`}
                x={t.x}
                y={t.y}
                movable={t.movable}
                onTap={() => handleTokenClick(t.player, t.tokenIndex)}
              >
                {/* Pawn base shadow */}
                <ellipse cx="0" cy="0.32" rx="0.36" ry="0.14" fill="rgba(0,0,0,0.35)" />

                {/* Pawn flared skirt/stem */}
                <path
                  d="M -0.3 0.28 L -0.16 -0.06 L 0.16 -0.06 L 0.3 0.28 Z"
                  fill={fillColor}
                  stroke="#222222"
                  strokeWidth="0.08"
                  strokeLinejoin="round"
                />

                {/* Pawn spherical head */}
                <circle cx="0" cy="-0.08" r="0.28" fill={fillColor} stroke="#222222" strokeWidth="0.08" />

                {/* Inner shine highlight */}
                <circle cx="0" cy="-0.08" r="0.16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.05" />

                {/* Movable indicator */}
                {t.movable && (
                  <circle
                    cx="0"
                    cy="0.05"
                    r="0.52"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="0.09"
                    className="animate-pulse"
                  />
                )}
              </AnimatedPawn>
            );
          })}
        </svg>

        {gameState.message && !gameState.gameOver && (
          <div className="absolute left-0 right-0 bottom-0 flex justify-center p-3 pointer-events-none" style={{ top: 0, alignItems: 'center' }}>
            <div
              className={`max-w-[85%] px-4 py-2 rounded-2xl bg-stone-900/85 text-white font-bold text-center text-base sm:text-lg shadow-xl ${
                isTopPlayerTurn ? 'rotate-180' : ''
              }`}
            >
              {gameState.message}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Player Action Bar (Player 1) */}
      <div className="w-full flex items-center justify-center gap-3">
        <button
          onClick={handleRoll}
          disabled={gameState.turn !== 0 || gameState.phase !== 'roll'}
          className={`h-14 px-8 rounded-2xl border-2 border-stone-800 shadow-lg font-black text-2xl tracking-widest text-white transition-all flex items-center gap-3 ${
            gameState.turn === 0 && gameState.phase === 'roll'
              ? 'bg-[#186b97] hover:bg-[#135a80] active:scale-95'
              : 'bg-[#186b97]/80 opacity-70'
          }`}
        >
          {diceButtonContent(0)}
        </button>

        <button
          onClick={() => setIsMenuOpen(true)}
          className="w-14 h-14 rounded-2xl bg-white hover:bg-stone-100 border-2 border-stone-800 shadow-lg flex items-center justify-center text-[#00b2f6] active:scale-95 transition-transform"
        >
          <Sparkles className="w-7 h-7 fill-current stroke-stone-800 stroke-[1.5]" />
        </button>
      </div>

      {/* Bottom Left Score Pill */}
      <ScorePill
        p1Score={p1Score}
        p2Score={p2Score}
        p1Color="#00afee"
        p2Color="#ff5757"
      />

      {/* In-Game Menu Modal */}
      <InGameMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onRestart={handleRestart}
        onOpenRules={onOpenRules}
        onExit={onSelectGame}
      />

      {/* Victory Modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={gameState.winner === 0 ? 'Vince il Blu! 🎉' : 'Vince il Rosso! 🎉'}
        winnerSubtitle={
          gameState.winner === 0
            ? playMode === 'bot'
              ? 'Bravissimo! Hai portato a casa tutte le pedine!'
              : 'Complimenti al Giocatore 1!'
            : playMode === 'bot'
            ? 'Il BOT ha vinto! Rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
