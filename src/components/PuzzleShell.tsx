import React from 'react';
import { RotateCw, HelpCircle } from 'lucide-react';

interface PuzzleShellProps {
  title: string;
  message: React.ReactNode;
  stats?: React.ReactNode;
  onRestart: () => void;
  onOpenRules: () => void;
  extraButtons?: React.ReactNode;
  children: React.ReactNode;
}

/** Shared frame for the single-player logic puzzles: message on top, board, controls below. */
export const PuzzleShell: React.FC<PuzzleShellProps> = ({
  title,
  message,
  stats,
  onRestart,
  onOpenRules,
  extraButtons,
  children,
}) => (
  <div className="w-full h-full flex flex-col items-center justify-center py-2 px-3 select-none">
    <div className="w-full max-w-xl flex items-center justify-between mb-2 pr-12">
      <h2 className="text-xl sm:text-2xl font-black text-white" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.25)' }}>
        {title}
      </h2>
      {stats && <div className="text-sm sm:text-base font-black text-white/90 text-right">{stats}</div>}
    </div>

    <div className="w-full max-w-xl mb-3 px-4 py-2 rounded-2xl bg-white text-stone-800 font-bold text-center text-sm sm:text-base border-2 border-stone-800 shadow-md">
      {message}
    </div>

    {children}

    <div className="w-full max-w-xl flex items-center justify-center flex-wrap mt-3" style={{ margin: '12px -4px 0' }}>
      {extraButtons}
      <button
        onClick={onRestart}
        className="m-1 h-12 px-5 rounded-2xl bg-amber-500 text-stone-950 font-black border-2 border-stone-800 shadow-md active:scale-95 flex items-center"
      >
        <RotateCw className="w-5 h-5 mr-2" />
        Nuova partita
      </button>
      <button
        onClick={onOpenRules}
        className="m-1 h-12 w-12 rounded-2xl bg-white text-stone-800 border-2 border-stone-800 shadow-md active:scale-95 flex items-center justify-center"
        aria-label="Regole"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    </div>
  </div>
);
