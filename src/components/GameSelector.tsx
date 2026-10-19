import React from 'react';
import { GameId, ALL_GAMES, GameMetadata } from '../games/registry';
import { useTheme } from '../theme/themeContext';
import { CircleDot, Grid3X3, Compass, Circle, Crown, Hash, Sparkles, ChevronRight, Play, Dices, Brain, Sprout, LayoutGrid, Contrast, Crosshair, Shapes } from 'lucide-react';

interface GameSelectorProps {
  onSelectGame: (id: GameId) => void;
  activeGameId: GameId;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  Grid3X3: <Grid3X3 className="w-6 h-6 text-red-500" />,
  CircleDot: <CircleDot className="w-6 h-6 text-amber-500" />,
  Compass: <Compass className="w-6 h-6 text-blue-500" />,
  Circle: <Circle className="w-6 h-6 text-emerald-500" />,
  Crown: <Crown className="w-6 h-6 text-purple-500" />,
  Hash: <Hash className="w-6 h-6 text-cyan-500" />,
  Dices: <Dices className="w-6 h-6 text-orange-500" />,
  Brain: <Brain className="w-6 h-6 text-pink-500" />,
  Sprout: <Sprout className="w-6 h-6 text-green-500" />,
  LayoutGrid: <LayoutGrid className="w-6 h-6 text-sky-500" />,
  Contrast: <Contrast className="w-6 h-6 text-slate-500" />,
  Crosshair: <Crosshair className="w-6 h-6 text-indigo-500" />,
  Shapes: <Shapes className="w-6 h-6 text-fuchsia-500" />,
};

export const GameSelector: React.FC<GameSelectorProps> = ({ onSelectGame, activeGameId }) => {
  const { theme, isDark } = useTheme();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4">
      {/* Intro Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Grandi Classici da Tavolo 1vs1
        </h1>
        <p className={`text-xs sm:text-sm mt-1.5 max-w-lg mx-auto ${theme.textMuted}`}>
          Regole chiare e semplificate per bambini dai 5 ai 7 anni e oltre. Gioca contro il BOT a difficoltà scalabile o sfida un amico!
        </p>
      </div>

      {/* Grid of games */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {ALL_GAMES.map((game) => {
          const isSelected = activeGameId === game.id;

          return (
            <div
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className={`group cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                theme.bgSurface
              } ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                  : 'hover:border-black/20 dark:hover:border-white/20 hover:-translate-y-0.5 shadow-sm'
              }`}
            >
              <div>
                {/* Header row with Icon and Unboxed Metadata */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/5 group-hover:scale-105 transition-transform">
                    {ICONS_MAP[game.iconName]}
                  </div>

                  {/* Clean unboxed metadata (anti-pill discipline) */}
                  <div className={`text-xs font-medium flex items-center gap-1.5 ${theme.textMuted}`}>
                    <span>{game.minAge}</span>
                    <span aria-hidden="true">·</span>
                    <span>{game.category}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
                  {game.title}
                </h3>
                <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${theme.textMuted}`}>
                  {game.subtitle}
                </p>
              </div>

              {/* Action bottom kicker */}
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-semibold">
                <span className={theme.textMuted}>{game.boardDescription}</span>
                <span className="flex items-center gap-1 text-amber-500 group-hover:translate-x-0.5 transition-transform">
                  <span>Gioca</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Games Expansion Teaser (As requested: designed to expand with Indovina Chi, Non ti Arrabbiare, UNO) */}
      <div
        className={`mt-6 p-4 rounded-2xl border ${theme.borderSubtle} ${theme.bgSurface} flex flex-col sm:flex-row items-center justify-between gap-3 text-xs`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              In Espansione: Prossimi Grandi Classici
            </div>
            <div className={`text-[11px] mt-0.5 ${theme.textMuted}`}>
              Non t'Arrabbiare (Ludo Junior), Indovina Chi e Battaglia delle Carte UNO
            </div>
          </div>
        </div>

        <div className="text-[11px] text-amber-500 font-semibold shrink-0">
          Architettura modulare pronta
        </div>
      </div>
    </div>
  );
};
