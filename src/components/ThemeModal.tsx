import React from 'react';
import { X, Check, Palette } from 'lucide-react';
import { useTheme, THEMES } from '../theme/themeContext';
import { ThemeId } from '../types/game';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
  const { themeId, setThemeId, theme, isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${theme.borderSubtle} ${theme.bgSurface} ${theme.textPrimary}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Temi Grafici</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className={`text-xs mt-3 mb-4 ${theme.textMuted}`}>
          Scegli lo stile visivo per tutti i giochi da tavolo. Il tema si adatta a telefono e tablet.
        </p>

        <div className="space-y-2.5">
          {(Object.keys(THEMES) as ThemeId[]).map((id) => {
            const item = THEMES[id];
            const isSelected = themeId === id;

            return (
              <button
                key={id}
                onClick={() => {
                  setThemeId(id);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between min-h-[52px] ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/30 ' + (isDark ? 'bg-white/10' : 'bg-black/5')
                    : 'border-transparent hover:border-black/10 dark:hover:border-white/10 ' + (isDark ? 'bg-black/20' : 'bg-white/40')
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Color swatch preview */}
                  <div
                    className="w-8 h-8 rounded-lg shadow-inner flex items-center justify-center border border-black/20 overflow-hidden"
                    style={{ backgroundColor: item.boardBg }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.pieceLight }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className={`text-xs ${theme.textMuted}`}>{item.description}</div>
                  </div>
                </div>

                {isSelected && <Check className="w-5 h-5 text-amber-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-3 border-t border-black/10 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors"
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
};
