import React, { useEffect, useState } from 'react';
import { GameId, ALL_GAMES } from '../games/registry';
import { useTheme } from '../theme/themeContext';

interface GameSelectorProps {
  onSelectGame: (id: GameId) => void;
  activeGameId: GameId;
}

// Profili dei due bambini — modifica qui nomi, età ed emoji.
interface Profile {
  id: string;
  name: string;
  age: number;
  emoji: string;
  color: string;
}

const PROFILES: Profile[] = [
  { id: 'leo', name: 'Leo', age: 5, emoji: '🦁', color: '#3B82F6' },
  { id: 'mia', name: 'Mia', age: 7, emoji: '🦊', color: '#F59E0B' },
];

const GAME_EMOJIS: Record<GameId, string> = {
  connect4: '🟡',
  checkers: '⚫',
  battleship: '🚢',
  go: '⚪',
  chess: '♟️',
  tictactoe: '❌',
  snakes: '🐍',
  memory: '🐶',
  mancala: '🫘',
  domino: '🎴',
  reversi: '🔘',
  morris: '✚',
  quarto: '🧩',
};

const GAME_COLORS: Record<GameId, string> = {
  connect4: '#EF4444',
  checkers: '#F59E0B',
  battleship: '#3B82F6',
  go: '#10B981',
  chess: '#8B5CF6',
  tictactoe: '#06B6D4',
  snakes: '#22C55E',
  memory: '#EC4899',
  mancala: '#B45309',
  domino: '#0EA5E9',
  reversi: '#64748B',
  morris: '#6366F1',
  quarto: '#D946EF',
};

export const GameSelector: React.FC<GameSelectorProps> = ({ onSelectGame, activeGameId }) => {
  const { theme } = useTheme();
  const [profileId, setProfileId] = useState<string>(PROFILES[0].id);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('tabletop_profile');
      if (saved && PROFILES.some((p) => p.id === saved)) setProfileId(saved);
    } catch {}
  }, []);

  const selectProfile = (id: string) => {
    setProfileId(id);
    try {
      window.localStorage.setItem('tabletop_profile', id);
    } catch {}
  };

  const activeProfile = PROFILES.find((p) => p.id === profileId) ?? PROFILES[0];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-5">
      {/* Greeting */}
      <header className="text-center mb-5">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Ciao, {activeProfile.name}! 👋
        </h1>
        <p className={`text-base sm:text-lg mt-1 font-semibold ${theme.textMuted}`}>
          Scegli un gioco e divertiti
        </p>
      </header>

      {/* Profiles */}
      <div className="flex gap-3 justify-center mb-6">
        {PROFILES.map((p) => {
          const on = p.id === profileId;
          return (
            <button
              key={p.id}
              onClick={() => selectProfile(p.id)}
              className={`flex flex-col items-center gap-1.5 flex-1 max-w-[180px] rounded-3xl p-4 border-2 transition-all ${
                on ? 'ring-2 ring-amber-500 border-transparent' : 'border-black/10 dark:border-white/10'
              } ${theme.bgSurface}`}
            >
              <span
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-3xl sm:text-4xl text-white"
                style={{ background: p.color, boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.15)' }}
              >
                {p.emoji}
              </span>
              <span className="text-lg sm:text-xl font-extrabold leading-none">{p.name}</span>
              <span className={`text-xs font-semibold ${theme.textMuted}`}>{p.age} anni</span>
            </button>
          );
        })}
      </div>

      {/* Giant tiles */}
      <div className="grid grid-cols-2 gap-4">
        {ALL_GAMES.map((game) => {
          const isSelected = activeGameId === game.id;
          return (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className={`relative flex flex-col items-center justify-center text-center text-white rounded-[28px] min-h-[220px] sm:min-h-[240px] p-5 overflow-hidden transition-transform active:scale-95 ${
                isSelected ? 'ring-4 ring-amber-400' : ''
              }`}
              style={{
                background: GAME_COLORS[game.id],
                boxShadow: '0 14px 30px -12px rgba(51,38,26,0.35)',
              }}
            >
              <span className="text-7xl sm:text-8xl leading-none drop-shadow-md">
                {GAME_EMOJIS[game.id]}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold leading-tight mt-3">{game.title}</span>
              <span className="mt-2 text-sm sm:text-base font-extrabold bg-black/20 px-3.5 py-1 rounded-full">
                {game.minAge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
