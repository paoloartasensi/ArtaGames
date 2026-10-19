import React, { useState, useMemo } from 'react';
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
};

export const GameSelector: React.FC<GameSelectorProps> = ({ onSelectGame, activeGameId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredGames = useMemo(() => {
    if (selectedCategory === 'all') return ALL_GAMES;
    if (selectedCategory === 'classic') {
      return ALL_GAMES.filter((g) => ['ludo', 'checkers', 'chess', 'snakes', 'domino'].includes(g.id));
    }
    if (selectedCategory === 'strategy') {
      return ALL_GAMES.filter((g) => ['connect4', 'go', 'reversi', 'quarto', 'morris', 'abalone'].includes(g.id));
    }
    if (selectedCategory === 'quick') {
      return ALL_GAMES.filter((g) => ['tictactoe', 'dotsboxes', 'memory', 'nim', 'battleship', 'gomoku'].includes(g.id));
    }
    return ALL_GAMES;
  }, [selectedCategory]);

  const handleRandomGame = () => {
    const randomIndex = Math.floor(Math.random() * ALL_GAMES.length);
    onSelectGame(ALL_GAMES[randomIndex].id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-2 pb-28 select-none">
      
      {/* Category Pills (Offline Games horizontal filter) */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 px-1 no-scrollbar mb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide shrink-0 transition-all border-2 ${
            selectedCategory === 'all'
              ? 'bg-amber-500 border-stone-900 text-stone-950 shadow-md scale-105'
              : 'bg-white/10 dark:bg-white/5 border-transparent text-stone-600 dark:text-stone-300 hover:bg-white/20'
          }`}
        >
          TUTTI ({ALL_GAMES.length})
        </button>

        <button
          onClick={() => setSelectedCategory('classic')}
          className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide shrink-0 transition-all border-2 ${
            selectedCategory === 'classic'
              ? 'bg-amber-500 border-stone-900 text-stone-950 shadow-md scale-105'
              : 'bg-white/10 dark:bg-white/5 border-transparent text-stone-600 dark:text-stone-300 hover:bg-white/20'
          }`}
        >
          CLASSICI
        </button>

        <button
          onClick={() => setSelectedCategory('strategy')}
          className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide shrink-0 transition-all border-2 ${
            selectedCategory === 'strategy'
              ? 'bg-amber-500 border-stone-900 text-stone-950 shadow-md scale-105'
              : 'bg-white/10 dark:bg-white/5 border-transparent text-stone-600 dark:text-stone-300 hover:bg-white/20'
          }`}
        >
          STRATEGIA
        </button>

        <button
          onClick={() => setSelectedCategory('quick')}
          className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide shrink-0 transition-all border-2 ${
            selectedCategory === 'quick'
              ? 'bg-amber-500 border-stone-900 text-stone-950 shadow-md scale-105'
              : 'bg-white/10 dark:bg-white/5 border-transparent text-stone-600 dark:text-stone-300 hover:bg-white/20'
          }`}
        >
          RAPIDI 1v1
        </button>
      </div>

      {/* Chunky Toy-Box 2-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-5">
        {filteredGames.map((game) => {
          const theme = GAME_THEMES[game.id] || {
            bgGradient: 'from-sky-500 to-blue-600',
            borderDark: '#0369a1',
            sub: game.title,
          };
          const isSelected = activeGameId === game.id;

          return (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              style={{
                borderColor: theme.borderDark,
              }}
              className={`relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-[30px] bg-gradient-to-b ${theme.bgGradient} text-white shadow-xl border-b-[6px] border-x border-t border-black/15 active:border-b-0 active:translate-y-1.5 transition-all overflow-hidden cursor-pointer group min-h-[190px] sm:min-h-[220px] ${
                isSelected ? 'ring-4 ring-amber-300' : ''
              }`}
            >
              {/* Badges bar */}
              <div className="w-full flex justify-between items-center z-10">
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-black/25 text-white/90 shadow-inner">
                  {game.minAge}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-black/20 text-white/90">
                  2P
                </span>
              </div>

              {/* Giant 3D Toy Emoji */}
              <span className="text-6xl sm:text-7xl drop-shadow-lg my-1 group-hover:scale-110 transition-transform select-none">
                {GAME_EMOJIS[game.id]}
              </span>

              {/* Giant Title & Subtitle */}
              <div className="text-center w-full z-10">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white drop-shadow-md leading-tight">
                  {game.title}
                </h3>
                <p className="text-[11px] sm:text-xs font-bold text-white/80 line-clamp-1 mt-0.5">
                  {theme.sub}
                </p>
              </div>

              {/* Subtle top shine overlay */}
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-[30px]" />
            </button>
          );
        })}
      </div>

      {/* Floating Bottom Action: "SCEGLI UN GIOCO A CASO" (Caratteristica Offline Games!) */}
      <div className="fixed bottom-5 left-0 right-0 z-40 px-4 max-w-sm mx-auto pointer-events-none">
        <button
          onClick={handleRandomGame}
          className="w-full pointer-events-auto py-4 px-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:brightness-110 border-b-[5px] border-stone-900 border-2 shadow-2xl flex items-center justify-center gap-2.5 text-stone-950 font-black text-base tracking-wider active:border-b-2 active:translate-y-1 transition-all cursor-pointer"
        >
          <Dices className="w-6 h-6 stroke-[2.5]" />
          <span>GIOCO A CASO</span>
        </button>
      </div>

    </div>
  );
};
