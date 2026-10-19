import React from 'react';
import { Volume2, VolumeX, RotateCcw, Undo2, HelpCircle, Bot, Users, RotateCw } from 'lucide-react';
import { PlayMode, Difficulty } from '../types/game';
import { useTheme } from '../theme/themeContext';
import { sound } from '../utils/audio';

interface GameControlsProps {
  playMode: PlayMode;
  onSetPlayMode: (mode: PlayMode) => void;
  allowPvp?: boolean;
  difficulty: Difficulty;
  onSetDifficulty: (diff: Difficulty) => void;
  onRestart: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onOpenRules: () => void;
  isTabletFlipped?: boolean;
  onToggleTabletFlip?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  playMode,
  onSetPlayMode,
  allowPvp = true,
  difficulty,
  onSetDifficulty,
  onRestart,
  onUndo,
  canUndo = false,
  onOpenRules,
  isTabletFlipped,
  onToggleTabletFlip,
}) => {
  const { theme, isDark } = useTheme();
  const [audioActive, setAudioActive] = React.useState(sound.enabled);

  const handleToggleSound = () => {
    const res = sound.toggleMute();
    setAudioActive(res);
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-2xl p-3 border ${theme.borderSubtle} ${theme.bgSurface} flex flex-wrap items-center justify-between gap-3 text-xs`}
    >
      {/* Left: Mode Switcher (BOT vs 1vs1 Locale) */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-black/10 dark:bg-white/10">
        <button
          onClick={() => {
            sound.playTick();
            onSetPlayMode('bot');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all min-h-[36px] ${
            playMode === 'bot'
              ? 'bg-amber-600 text-white shadow-sm'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-stone-600 hover:text-black'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>vs BOT</span>
        </button>

        {allowPvp && (
          <button
            onClick={() => {
              sound.playTick();
              onSetPlayMode('local_pvp');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all min-h-[36px] ${
              playMode === 'local_pvp'
                ? 'bg-amber-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-stone-600 hover:text-black'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1 vs 1 Locale</span>
          </button>
        )}
      </div>

      {/* Middle: Bot Scalable Difficulty Selector (shown only in BOT mode) */}
      {playMode === 'bot' && (
        <div className="flex items-center gap-1">
          <span className={`text-[11px] font-medium mr-1 hidden sm:inline ${theme.textMuted}`}>
            Livello:
          </span>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/10 dark:bg-white/5">
            <button
              onClick={() => {
                sound.playTick();
                onSetDifficulty('easy');
              }}
              title="Per bambini 5-6 anni: mosse gentili e semplici"
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                difficulty === 'easy'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌱 Cucciolo (5a)
            </button>
            <button
              onClick={() => {
                sound.playTick();
                onSetDifficulty('medium');
              }}
              title="Per bambini 6-7 anni: equilibrato"
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                difficulty === 'medium'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⭐ Campione (7a)
            </button>
            <button
              onClick={() => {
                sound.playTick();
                onSetDifficulty('hard');
              }}
              title="Per bambini 8+ o genitori"
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                difficulty === 'hard' || difficulty === 'master'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👑 Maestro
            </button>
          </div>
        </div>
      )}

      {/* Right: Functional Action buttons */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Tablet Flip in 1v1 mode */}
        {playMode === 'local_pvp' && onToggleTabletFlip && (
          <button
            onClick={() => {
              sound.playTick();
              onToggleTabletFlip();
            }}
            title={isTabletFlipped ? 'Ripristina orientamento' : 'Ruota scacchiera per tablet (gioco faccia a faccia)'}
            className={`p-2 rounded-lg border transition-colors flex items-center justify-center min-h-[36px] min-w-[36px] ${
              isTabletFlipped
                ? 'bg-blue-600 text-white border-blue-500'
                : isDark
                ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                : 'border-black/10 text-stone-700 hover:text-black hover:bg-black/5'
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}

        {/* Undo */}
        {onUndo && (
          <button
            onClick={() => {
              if (canUndo) {
                sound.playTick();
                onUndo();
              }
            }}
            disabled={!canUndo}
            title="Annulla ultima mossa"
            className={`p-2 rounded-lg border transition-colors flex items-center justify-center min-h-[36px] min-w-[36px] ${
              canUndo
                ? isDark
                  ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                  : 'border-black/10 text-stone-700 hover:text-black hover:bg-black/5'
                : 'opacity-40 cursor-not-allowed border-transparent'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
        )}

        {/* Sound toggle */}
        <button
          onClick={handleToggleSound}
          title={audioActive ? 'Disattiva Suoni' : 'Attiva Suoni'}
          className={`p-2 rounded-lg border transition-colors flex items-center justify-center min-h-[36px] min-w-[36px] ${
            isDark
              ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
              : 'border-black/10 text-stone-700 hover:text-black hover:bg-black/5'
          }`}
        >
          {audioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Rules button */}
        <button
          onClick={() => {
            sound.playTick();
            onOpenRules();
          }}
          title="Regole spiegate ai bambini"
          className={`p-2 rounded-lg border transition-colors flex items-center justify-center min-h-[36px] min-w-[36px] ${
            isDark
              ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
              : 'border-black/10 text-stone-700 hover:text-black hover:bg-black/5'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Restart button */}
        <button
          onClick={() => {
            sound.playTick();
            onRestart();
          }}
          title="Ricomincia partita"
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-transform active:scale-95 flex items-center gap-1.5 min-h-[36px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Ricomincia</span>
        </button>
      </div>
    </div>
  );
};
