import React from 'react';
import { RotateCcw, HelpCircle, LogOut, Play, X } from 'lucide-react';

interface InGameMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onOpenRules: () => void;
  onExit: () => void;
}

export const InGameMenuModal: React.FC<InGameMenuModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  onOpenRules,
  onExit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xs bg-white dark:bg-stone-900 border-2 border-stone-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-stone-800 dark:hover:text-white rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-stone-900 dark:text-white mt-1 mb-4">
          Pausa
        </h3>

        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              onClose();
              onRestart();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ricomincia Partita</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenRules();
            }}
            className="w-full py-3 px-4 rounded-2xl border-2 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Regole del Gioco</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onExit();
            }}
            className="w-full py-3 px-4 rounded-2xl border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Esci al Menu</span>
          </button>

          <button
            onClick={onClose}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#186b97] hover:bg-[#13587d] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Continua</span>
          </button>
        </div>
      </div>
    </div>
  );
};
