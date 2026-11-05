import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { GameId, ALL_GAMES } from '../games/registry';
import { Dices } from 'lucide-react';

interface GameSelectorProps {
  onSelectGame: (id: GameId) => void;
  activeGameId: GameId;
}

const GAME_EMOJIS: Record<GameId, string> = {
  ludo: '🎲',
  connect4: '🟡',
  checkers: '⚫',
  tictactoe: '❌',
  chess: '♟️',
  snakes: '🐍',
  battleship: '🚢',
  memory: '🐶',
  go: '⚪',
  mancala: '🫘',
  domino: '🎴',
  reversi: '🔘',
  morris: '✚',
  quarto: '🧩',
  dotsboxes: '🔲',
  gomoku: '🎯',
  nim: '🪵',
  abalone: '🎱',
  guesswho: '🕵️',
  goose: '🪿',
  simon: '🎶',
  uno: '🃏',
  tetris: '🧱',
  pacman: '🟡',
};

const GAME_THEMES: Record<GameId, { bgGradient: string; borderDark: string; sub: string }> = {
  ludo: { bgGradient: 'from-[#f97316] to-[#ea580c]', borderDark: '#c2410c', sub: "Non t'Arrabbiare" },
  connect4: { bgGradient: 'from-[#ef4444] to-[#dc2626]', borderDark: '#b91c1c', sub: 'Forza 4' },
  checkers: { bgGradient: 'from-[#f59e0b] to-[#d97706]', borderDark: '#b45309', sub: 'Dama Classica' },
  tictactoe: { bgGradient: 'from-[#06b6d4] to-[#0891b2]', borderDark: '#0e7490', sub: 'Tris 3x3' },
  chess: { bgGradient: 'from-[#8b5cf6] to-[#7c3aed]', borderDark: '#6d28d9', sub: 'Scacchi' },
  snakes: { bgGradient: 'from-[#22c55e] to-[#16a34a]', borderDark: '#15803d', sub: 'Scale e Serpenti' },
  battleship: { bgGradient: 'from-[#3b82f6] to-[#2563eb]', borderDark: '#1d4ed8', sub: 'Navi da Guerra' },
  memory: { bgGradient: 'from-[#ec4899] to-[#db2777]', borderDark: '#be185d', sub: 'Coppie di Animali' },
  go: { bgGradient: 'from-[#10b981] to-[#059669]', borderDark: '#047857', sub: 'Go Tradizionale' },
  mancala: { bgGradient: 'from-[#d97706] to-[#b45309]', borderDark: '#92400e', sub: 'Kalaha' },
  domino: { bgGradient: 'from-[#0ea5e9] to-[#0284c7]', borderDark: '#0369a1', sub: 'Domino Classico' },
  reversi: { bgGradient: 'from-[#64748b] to-[#475569]', borderDark: '#334155', sub: 'Othello' },
  morris: { bgGradient: 'from-[#6366f1] to-[#4f46e5]', borderDark: '#4338ca', sub: 'Mulino / Filetto' },
  quarto: { bgGradient: 'from-[#d946ef] to-[#c026d3]', borderDark: '#a21caf', sub: 'Quarto 4x4' },
  dotsboxes: { bgGradient: 'from-[#14b8a6] to-[#0d9488]', borderDark: '#0f766e', sub: 'Punti e Linee' },
  gomoku: { bgGradient: 'from-[#eab308] to-[#ca8a04]', borderDark: '#a16207', sub: '5 in Fila' },
  nim: { bgGradient: 'from-[#a855f7] to-[#9333ea]', borderDark: '#7e22ce', sub: 'Gioco di Nim' },
  abalone: { bgGradient: 'from-[#f43f5e] to-[#e11d48]', borderDark: '#be123c', sub: 'Biglie Sumo' },
  guesswho: { bgGradient: 'from-[#6366f1] to-[#3b82f6]', borderDark: '#1e40af', sub: 'Indovina Chi' },
  goose: { bgGradient: 'from-[#10b981] to-[#047857]', borderDark: '#065f46', sub: "Gioco dell'Oca" },
  simon: { bgGradient: 'from-[#a855f7] to-[#7e22ce]', borderDark: '#6b21a8', sub: 'Simon Dice' },
  uno: { bgGradient: 'from-[#ef4444] via-[#f59e0b] to-[#3b82f6]', borderDark: '#b91c1c', sub: 'UNO! Carte' },
  tetris: { bgGradient: 'from-[#06b6d4] to-[#0284c7]', borderDark: '#0891b2', sub: 'Tetris Classico' },
  pacman: { bgGradient: 'from-[#eab308] to-[#ca8a04]', borderDark: '#a16207', sub: 'Pac-Man Arcade' },
};

const CATEGORIES: { id: string; label: string; ids?: GameId[] }[] = [
  { id: 'all', label: 'TUTTI' },
  { id: 'classic', label: 'CLASSICI', ids: ['ludo', 'checkers', 'chess', 'snakes', 'domino', 'guesswho', 'goose', 'uno', 'tetris'] },
  { id: 'strategy', label: 'STRATEGIA', ids: ['connect4', 'go', 'reversi', 'quarto', 'morris', 'abalone'] },
  { id: 'quick', label: 'RAPIDI 1v1', ids: ['tictactoe', 'dotsboxes', 'memory', 'nim', 'battleship', 'gomoku', 'simon', 'pacman'] },
];

const GAP = 10;
const BOTTOM_PAD = 16;
const MIN_TILE = 84; // below this, tiles get too small: fall back to scrolling

/**
 * Picks the column count that makes every tile as large as possible while
 * keeping ALL tiles visible in the available area (no page scroll).
 */
function computeLayout(count: number, width: number, height: number) {
  let best = { cols: 1, tileW: 0, tileH: 0 };
  let bestScore = -1;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const tileW = (width - (cols - 1) * GAP) / cols;
    const tileH = (height - (rows - 1) * GAP) / rows;
    if (tileW <= 0 || tileH <= 0) continue;
    // Prefer tiles close to square: each side is only useful up to ~1.15x the other
    const score = Math.min(tileW, tileH * 1.15) * Math.min(tileH, tileW * 1.15);
    if (score > bestScore) {
      bestScore = score;
      best = { cols, tileW, tileH };
    }
  }
  return best;
}

export const GameSelector: React.FC<GameSelectorProps> = ({ onSelectGame, activeGameId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const gridRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ w: 0, h: 0 });

  const filteredGames = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    if (!cat || !cat.ids) return ALL_GAMES;
    const ids = cat.ids;
    return ALL_GAMES.filter((g) => ids.indexOf(g.id) !== -1);
  }, [selectedCategory]);

  // Measure the tile area on resize/rotation (no ResizeObserver: old iPads lack it)
  useLayoutEffect(() => {
    const measure = () => {
      const el = gridRef.current;
      if (!el) return;
      // Height from the viewport, not from CSS: Safari 9 can't resolve % heights
      // inside flex items, so clientHeight would be 0 there.
      const top = el.getBoundingClientRect().top;
      const h = Math.floor(window.innerHeight - top - BOTTOM_PAD);
      setArea({ w: el.clientWidth || window.innerWidth - 24, h });
    };
    measure();
    const t = setTimeout(measure, 300);
    const delayed = () => {
      measure();
      setTimeout(measure, 250);
    };
    window.addEventListener('resize', delayed);
    window.addEventListener('orientationchange', delayed);
    return () => {
      window.removeEventListener('resize', delayed);
      window.removeEventListener('orientationchange', delayed);
      clearTimeout(t);
    };
  }, []);

  const handleRandomGame = () => {
    const randomIndex = Math.floor(Math.random() * ALL_GAMES.length);
    onSelectGame(ALL_GAMES[randomIndex].id);
  };

  const fitted = computeLayout(filteredGames.length, area.w, Math.max(area.h, 0));
  const tooSmall = Math.min(fitted.tileW, fitted.tileH) < MIN_TILE;
  // Fallback (very small screens / failed measure): fixed-size tiles in a scrollable area
  const fallbackCols = Math.max(2, Math.floor((area.w + GAP) / (120 + GAP)));
  const cols = tooSmall ? fallbackCols : fitted.cols;
  const tileW = tooSmall ? (area.w - (cols - 1) * GAP) / cols : fitted.tileW;
  const tileH = tooSmall ? Math.max(MIN_TILE, Math.min(tileW, 140)) : fitted.tileH;
  const side = Math.min(tileW, tileH);
  const emojiSize = Math.max(18, Math.min(side * 0.42, 84));
  const titleSize = Math.max(10, Math.min(side * 0.13, 22));
  const showSub = tileH >= 120 && tileW >= 110;
  const showBadges = tileH >= 150 && tileW >= 130;
  const radius = Math.max(12, Math.min(side * 0.16, 30));

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 select-none">
      {/* Category pills + random game */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 sm:px-4 py-2 rounded-2xl text-xs font-black tracking-wide shrink-0 transition-all border-2 ${
              selectedCategory === cat.id
                ? 'bg-amber-500 border-stone-900 text-stone-950 shadow-md'
                : 'bg-white/10 dark:bg-white/5 border-transparent text-stone-600 dark:text-stone-300 hover:bg-white/20'
            }`}
          >
            {cat.id === 'all' ? `${cat.label} (${ALL_GAMES.length})` : cat.label}
          </button>
        ))}
        <button
          onClick={handleRandomGame}
          className="ml-auto shrink-0 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 border-2 border-stone-900 text-stone-950 font-black text-xs tracking-wide shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <Dices className="w-4 h-4 stroke-[2.5]" />
          <span>A CASO</span>
        </button>
      </div>

      {/* Fit-to-screen tile area: every game always visible, no scrolling */}
      <div
        ref={gridRef}
        className={`w-full mt-1 ${tooSmall ? 'overflow-y-auto allow-scroll' : 'overflow-hidden'}`}
        style={{ height: area.h > 0 ? area.h : undefined, WebkitOverflowScrolling: 'touch' }}
      >
        {area.w > 0 && (
          <div className="flex flex-wrap content-start" style={{ margin: -GAP / 2 }}>
            {filteredGames.map((game) => {
              const theme = GAME_THEMES[game.id] || {
                bgGradient: 'from-sky-500 to-blue-600',
                borderDark: '#0369a1',
                sub: game.title,
              };
              const isSelected = activeGameId === game.id;

              return (
                <div key={game.id} style={{ width: `${100 / cols}%`, height: tileH + GAP, padding: GAP / 2 }}>
                  <button
                    onClick={() => onSelectGame(game.id)}
                    style={{ borderColor: theme.borderDark, borderRadius: radius }}
                    className={`relative w-full h-full flex flex-col items-center justify-center p-1.5 bg-gradient-to-b ${theme.bgGradient} text-white shadow-lg border-b-4 border-x border-t border-black/15 active:border-b-0 active:translate-y-1 transition-all overflow-hidden cursor-pointer ${
                      isSelected ? 'ring-4 ring-amber-300' : ''
                    }`}
                  >
                    {showBadges && (
                      <span className="absolute top-2 left-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/25 text-white/90">
                        {game.minAge}
                      </span>
                    )}
                    <span className="drop-shadow-lg leading-none select-none" style={{ fontSize: emojiSize }}>
                      {GAME_EMOJIS[game.id]}
                    </span>
                    <span
                      className="font-black tracking-tight text-white drop-shadow-md leading-tight text-center w-full truncate mt-1"
                      style={{ fontSize: titleSize }}
                    >
                      {game.title}
                    </span>
                    {showSub && (
                      <span className="text-[11px] font-bold text-white/80 truncate w-full text-center">
                        {theme.sub}
                      </span>
                    )}
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
