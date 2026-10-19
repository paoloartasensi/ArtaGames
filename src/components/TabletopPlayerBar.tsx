import React from 'react';

interface TabletopPlayerBarProps {
  playerNumber: 1 | 2;
  playerName: string;
  color: string;
  isCurrentTurn: boolean;
  isFlipped?: boolean; // When true (Player 2 in 1vs1 tabletop mode), rotates 180 degrees
  score?: number | string;
  pieceIcon?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const TabletopPlayerBar: React.FC<TabletopPlayerBarProps> = ({
  playerNumber,
  playerName,
  color,
  isCurrentTurn,
  isFlipped = false,
  score,
  pieceIcon,
  actionButton,
}) => {
  return (
    <div
      className={`w-full flex items-center justify-between gap-3 px-4 py-2 transition-transform select-none ${
        isFlipped ? 'rotate-180' : ''
      }`}
    >
      {/* Player identity pill with active glow */}
      <div
        className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 transition-all ${
          isCurrentTurn
            ? 'bg-white border-stone-900 text-stone-950 shadow-lg scale-105'
            : 'bg-white/40 dark:bg-black/20 border-black/10 dark:border-white/10 text-stone-700 dark:text-stone-300 opacity-70'
        }`}
      >
        <div
          className="w-4 h-4 rounded-full shadow-sm border border-stone-900/30 shrink-0 flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          {pieceIcon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-wide leading-none">{playerName}</span>
          {isCurrentTurn && (
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">
              Tocca a te!
            </span>
          )}
        </div>
      </div>

      {/* Middle/Right: Optional score & Action controls */}
      <div className="flex items-center gap-2.5">
        {score !== undefined && (
          <div className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-black/30 border border-stone-800 text-stone-900 dark:text-white font-black text-xs shadow-sm">
            <span>{score}</span>
          </div>
        )}
        {actionButton}
      </div>
    </div>
  );
};
