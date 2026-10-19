import React from 'react';
import { GameId, ALL_GAMES } from '../games/registry';
import { useTheme } from '../theme/themeContext';

interface GameSelectorProps {
  onSelectGame: (id: GameId) => void;
  activeGameId: GameId;
}

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
  ludo: '🎲',
  dotsboxes: '🔲',
  gomoku: '🎯',
  nim: '🪵',
  abalone: '🎱',
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
  ludo: '#F97316',
  dotsboxes: '#14B8A6',
  gomoku: '#EAB308',
  nim: '#A855F7',
  abalone: '#F43F5E',
};

export const GameSelector: React.FC<GameSelectorProps> = ({ onSelectGame, activeGameId }) => {
  const { theme } = useTheme();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-5">
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Scegli un gioco</h1>
        <p className={`text-base sm:text-lg mt-1 font-semibold ${theme.textMuted}`}>
          1 vs 1: giocate insieme!
        </p>
      </header>

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
