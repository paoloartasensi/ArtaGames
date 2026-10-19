import React from 'react';

interface ScorePillProps {
  p1Score?: number;
  p2Score?: number;
  p1Color?: string;
  p2Color?: string;
  onClick?: () => void;
}

export const ScorePill: React.FC<ScorePillProps> = ({
  p1Score = 0,
  p2Score = 0,
  p1Color = '#00b2f6',
  p2Color = '#ff5757',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="fixed bottom-6 left-0 z-40 bg-white border-2 border-l-0 border-stone-800 rounded-r-2xl shadow-md px-3 py-2 flex items-center gap-2 select-none"
    >
      <div className="flex flex-col items-center gap-1">
        <span
          className="w-2.5 h-2.5 rounded-full inline-block"
          style={{ backgroundColor: p1Color }}
        />
        <span
          className="w-2.5 h-2.5 rounded-full inline-block"
          style={{ backgroundColor: p2Color }}
        />
      </div>
      <div className="flex flex-col items-center font-black text-xs text-stone-900 leading-none">
        <span>{p1Score}</span>
        <span className="text-[9px] opacity-40">:</span>
        <span>{p2Score}</span>
      </div>
    </div>
  );
};
