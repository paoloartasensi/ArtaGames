import React from 'react';

interface ExitButtonProps {
  onExit: () => void;
}

export const ExitButton: React.FC<ExitButtonProps> = ({ onExit }) => {
  return (
    <button
      onClick={onExit}
      title="Torna al catalogo"
      className="fixed top-5 right-0 z-50 bg-white hover:bg-stone-100 text-stone-900 border-2 border-r-0 border-stone-800 rounded-l-2xl shadow-lg pl-3 pr-2 py-4 flex flex-col items-center justify-center font-black tracking-widest text-xs select-none active:translate-x-1 transition-all cursor-pointer"
      style={{
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        letterSpacing: '0.15em',
      }}
    >
      USCITA
    </button>
  );
};
