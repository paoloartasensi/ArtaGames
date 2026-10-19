import React from 'react';
import { X, BookOpen, Lightbulb } from 'lucide-react';
import { GameMetadata } from '../games/registry';
import { useTheme } from '../theme/themeContext';

interface KidsRulesModalProps {
  game: GameMetadata;
  isOpen: boolean;
  onClose: () => void;
}

export const KidsRulesModal: React.FC<KidsRulesModalProps> = ({ game, isOpen, onClose }) => {
  const { theme, isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${theme.borderSubtle} ${theme.bgSurface} ${theme.textPrimary}`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">{game.rulesKidFriendly.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="mt-4 space-y-3">
          {game.rulesKidFriendly.steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-black/20 border-white/5' : 'bg-white/60 border-stone-200'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs leading-relaxed font-medium">{step}</p>
            </div>
          ))}
        </div>

        {/* Helpful Tip */}
        <div
          className={`mt-4 p-3.5 rounded-xl border flex items-start gap-3 ${
            isDark ? 'bg-amber-950/20 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{game.rulesKidFriendly.tip}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors"
          >
            Ho capito, giochiamo! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
