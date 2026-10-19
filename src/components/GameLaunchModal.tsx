import React, { useState } from 'react';
import { GameId, GAME_REGISTRY } from '../games/registry';
import { PlayMode, Difficulty } from '../types/game';
import { Bot, Users, Play, HelpCircle, X } from 'lucide-react';

interface GameLaunchModalProps {
  gameId: GameId | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (mode: PlayMode, difficulty: Difficulty) => void;
  onOpenRules: () => void;
}

export const GameLaunchModal: React.FC<GameLaunchModalProps> = ({
  gameId,
  isOpen,
  onClose,
  onLaunch,
  onOpenRules,
}) => {
  const [playMode, setPlayMode] = useState<PlayMode>('bot');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  if (!isOpen || !gameId) return null;

  const game = GAME_REGISTRY[gameId];

  const handleStart = () => {
    onLaunch(playMode, difficulty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 border-2 border-stone-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-black text-stone-900 dark:text-white mt-1 text-center">
          {game.title}
        </h2>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          {game.category} · {game.minAge}
        </p>

        {/* Mode Selector */}
        <div className="w-full mt-6 space-y-3">
          <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Modalità di Gioco
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPlayMode('bot')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                playMode === 'bot'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-400'
              }`}
            >
              <Bot className="w-6 h-6" />
              <span className="text-xs font-bold">1 Giocatore</span>
              <span className="text-[10px] opacity-70">vs Computer</span>
            </button>

            <button
              type="button"
              onClick={() => setPlayMode('pass-and-play')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                playMode === 'pass-and-play'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-400'
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs font-bold">2 Giocatori</span>
              <span className="text-[10px] opacity-70">Stesso Schermo</span>
            </button>
          </div>
        </div>

        {/* Difficulty Selector (only for vs Bot) */}
        {playMode === 'bot' && (
          <div className="w-full mt-4 space-y-2">
            <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Difficoltà Bot
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                const label = d === 'easy' ? 'Facile' : d === 'medium' ? 'Medio' : 'Difficile';
                const isSelected = difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border-2 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Game Action Button */}
        <button
          onClick={handleStart}
          className="w-full mt-6 py-4 rounded-2xl bg-[#186b97] hover:bg-[#13587d] text-white font-black text-lg tracking-wide shadow-lg shadow-sky-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>GIOCA</span>
        </button>

        {/* Rules button */}
        <button
          onClick={onOpenRules}
          className="mt-3 flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Leggi le regole veloci</span>
        </button>
      </div>
    </div>
  );
};
