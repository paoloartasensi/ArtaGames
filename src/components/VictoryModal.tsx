import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, LayoutGrid } from 'lucide-react';
import { useTheme } from '../theme/themeContext';
import { sound } from '../utils/audio';
import { AnimatePresence, motion } from 'motion/react';

interface VictoryModalProps {
  isOpen: boolean;
  winnerTitle: string;
  winnerSubtitle: string;
  isDraw?: boolean;
  onRematch: () => void;
  onSelectGame: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  winnerTitle,
  winnerSubtitle,
  isDraw = false,
  onRematch,
  onSelectGame,
}) => {
  const { theme, isDark } = useTheme();

  useEffect(() => {
    if (isOpen) {
      if (!isDraw) {
        sound.playWin();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }
  }, [isOpen, isDraw]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={`w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl border ${theme.borderSubtle} ${theme.bgSurface} ${theme.textPrimary}`}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <Trophy className="w-9 h-9" />
            </div>

            <h2 className="text-xl font-bold tracking-tight">{winnerTitle}</h2>
            <p className={`text-xs mt-1.5 leading-relaxed ${theme.textMuted}`}>{winnerSubtitle}</p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={onRematch}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-amber-600 hover:bg-amber-500 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Gioca di Nuovo</span>
              </button>

              <button
                onClick={onSelectGame}
                className={`w-full py-2.5 rounded-xl font-medium text-xs border transition-colors flex items-center justify-center gap-2 ${
                  isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-black/10 hover:bg-black/5 text-stone-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tutti i Giochi</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
