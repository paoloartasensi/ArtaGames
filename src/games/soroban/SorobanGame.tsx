import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PlayMode, Difficulty } from '../../types/game';
import {
  createEmptySoroban,
  getRodValue,
  getSorobanValue,
  generateSumChallenge,
  toggleUpperBead,
  handleLowerBeadClick,
  setLowerBeads,
  ROD_COUNT,
  ROD_LABELS,
  RECKONING_DOT_INDICES,
  SorobanDifficulty,
  SorobanSumChallenge,
  SorobanRod,
} from './sorobanEngine';
import { sound } from '../../utils/audio';
import {
  RotateCcw,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  Dice5,
  CheckCircle2,
  Trophy,
} from 'lucide-react';

interface SorobanGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

type BeadColorType = 'blue' | 'green' | 'yellow' | 'orange' | 'red';

interface BeadColorPalette {
  topGrad: [string, string, string]; // [specular highlight, midtone, shade]
  botGrad: [string, string, string]; // [top shadow, base shadow, dark rim]
  stroke: string;
  ridgeHighlight: string;
}

const BEAD_PALETTES: Record<BeadColorType, BeadColorPalette> = {
  blue: {
    // Upper deck (Heaven bead: 5)
    topGrad: ['#93c5fd', '#3b82f6', '#1d4ed8'],
    botGrad: ['#1d4ed8', '#1e3a8a', '#172554'],
    stroke: '#0f172a',
    ridgeHighlight: '#dbeafe',
  },
  green: {
    // Lower deck row 0 (Earth bead 1: value 1)
    topGrad: ['#bbf7d0', '#22c55e', '#16a34a'],
    botGrad: ['#16a34a', '#15803d', '#052e16'],
    stroke: '#022c22',
    ridgeHighlight: '#dcfce7',
  },
  yellow: {
    // Lower deck row 1 (Earth bead 2: value 1)
    topGrad: ['#fef08a', '#eab308', '#ca8a04'],
    botGrad: ['#ca8a04', '#a16207', '#713f12'],
    stroke: '#451a03',
    ridgeHighlight: '#fef9c3',
  },
  orange: {
    // Lower deck row 2 (Earth bead 3: value 1)
    topGrad: ['#fed7aa', '#f97316', '#ea580c'],
    botGrad: ['#ea580c', '#9a3412', '#7c2d12'],
    stroke: '#431407',
    ridgeHighlight: '#ffedd5',
  },
  red: {
    // Lower deck row 3 (Earth bead 4: value 1)
    topGrad: ['#fecaca', '#ef4444', '#dc2626'],
    botGrad: ['#dc2626', '#991b1b', '#450a0a'],
    stroke: '#450a0a',
    ridgeHighlight: '#fee2e2',
  },
};

/**
 * Bi-conical Rainbow Japanese Soroban Bead SVG
 * Inspired directly by traditional Montessori / Japanese colorful abacus
 */
const SorobanBead: React.FC<{
  color: BeadColorType;
  isActive: boolean;
  isUpper?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: () => void;
}> = ({ color, isActive, isUpper, onPointerDown, onClick }) => {
  const palette = BEAD_PALETTES[color];
  const gradIdTop = `top-${color}-${isUpper ? 'u' : 'l'}`;
  const gradIdBot = `bot-${color}-${isUpper ? 'u' : 'l'}`;

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={onClick}
      className="relative w-full h-[26px] sm:h-[30px] cursor-pointer select-none touch-none flex items-center justify-center transition-transform active:scale-95 px-0.5"
      role="button"
      tabIndex={0}
      aria-label={`${color} bead`}
    >
      <svg
        viewBox="0 0 60 26"
        className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)] overflow-visible"
      >
        <defs>
          <linearGradient id={gradIdTop} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.topGrad[0]} />
            <stop offset="35%" stopColor={palette.topGrad[1]} />
            <stop offset="100%" stopColor={palette.topGrad[2]} />
          </linearGradient>
          <linearGradient id={gradIdBot} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.botGrad[0]} />
            <stop offset="65%" stopColor={palette.botGrad[1]} />
            <stop offset="100%" stopColor={palette.botGrad[2]} />
          </linearGradient>
        </defs>

        {/* Top conical facet */}
        <polygon
          points="30,2 58,13 2,13"
          fill={`url(#${gradIdTop})`}
          stroke={palette.stroke}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />

        {/* Bottom conical facet */}
        <polygon
          points="2,13 58,13 30,24"
          fill={`url(#${gradIdBot})`}
          stroke={palette.stroke}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />

        {/* Center ridge specular highlight */}
        <line
          x1="3"
          y1="13"
          x2="57"
          y2="13"
          stroke={palette.ridgeHighlight}
          strokeWidth="1.3"
          strokeOpacity={isActive ? 0.95 : 0.75}
        />

        {/* Central hole through which natural birch dowel passes */}
        <circle cx="30" cy="13" r="2.2" fill="#d97706" stroke={palette.stroke} strokeWidth="0.8" />
      </svg>
    </div>
  );
};

export const SorobanGame: React.FC<SorobanGameProps> = ({
  difficulty: initialDifficulty,
  onOpenRules,
}) => {
  const [level, setLevel] = useState<SorobanDifficulty>(() => {
    if (initialDifficulty === 'easy') return 'easy';
    if (initialDifficulty === 'hard' || initialDifficulty === 'master') return 'hard';
    return 'medium';
  });

  const [rods, setRods] = useState<SorobanRod[]>(() => createEmptySoroban(ROD_COUNT));
  const [challenge, setChallenge] = useState<SorobanSumChallenge>(() => generateSumChallenge(level));
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [showHelperValue, setShowHelperValue] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);

  // Drag interaction tracking
  const dragRef = useRef<{
    rodIndex: number;
    deck: 'upper' | 'lower';
    beadIndex?: number;
    startY: number;
  } | null>(null);

  const sorobanValue = getSorobanValue(rods);

  // Check victory condition: only when the player's soroban matches the target sum!
  useEffect(() => {
    if (!isSolved && sorobanValue === challenge.target) {
      setIsSolved(true);
      setStreak((prev) => prev + 1);
      sound.playVictory();

      try {
        confetti({
          particleCount: 65,
          spread: 80,
          origin: { y: 0.55 },
        });
      } catch {}
    }
  }, [sorobanValue, challenge.target, isSolved]);

  const generateNewChallenge = (nextLevel = level) => {
    const next = generateSumChallenge(nextLevel, challenge.target);
    setChallenge(next);
    setIsSolved(false);
    sound.playMove();
  };

  const handleLevelChange = (newLevel: SorobanDifficulty) => {
    setLevel(newLevel);
    generateNewChallenge(newLevel);
  };

  const handleResetSoroban = () => {
    setRods(createEmptySoroban(ROD_COUNT));
    sound.playStone();
  };

  // --- Bead Interaction Handlers ---
  const onUpperBeadClick = (rodIndex: number) => {
    const pitch = 0.75 + (rodIndex / ROD_COUNT) * 0.6;
    sound.playBead(pitch);
    setRods((prev) => toggleUpperBead(prev, rodIndex));
  };

  const onLowerBeadClick = (rodIndex: number, beadIndex: number) => {
    const pitch = 0.75 + (rodIndex / ROD_COUNT) * 0.6;
    sound.playBead(pitch);
    setRods((prev) => handleLowerBeadClick(prev, rodIndex, beadIndex));
  };

  // Pointer drag gestures for tactile feel
  const handlePointerDown = (
    e: React.PointerEvent,
    rodIndex: number,
    deck: 'upper' | 'lower',
    beadIndex?: number
  ) => {
    dragRef.current = {
      rodIndex,
      deck,
      beadIndex,
      startY: e.clientY,
    };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { rodIndex, deck, beadIndex, startY } = dragRef.current;
    const diffY = e.clientY - startY;
    dragRef.current = null;

    if (Math.abs(diffY) > 14) {
      const pitch = 0.75 + (rodIndex / ROD_COUNT) * 0.6;
      if (deck === 'upper') {
        const shouldBeActive = diffY > 0;
        setRods((prev) => {
          if (prev[rodIndex].upper !== shouldBeActive) {
            sound.playBead(pitch);
            return toggleUpperBead(prev, rodIndex);
          }
          return prev;
        });
      } else {
        if (diffY < 0 && beadIndex !== undefined) {
          // Dragged up -> activate
          setRods((prev) => {
            sound.playBead(pitch);
            return setLowerBeads(prev, rodIndex, Math.max(prev[rodIndex].lower, beadIndex + 1));
          });
        } else if (diffY > 0 && beadIndex !== undefined) {
          // Dragged down -> deactivate
          setRods((prev) => {
            sound.playBead(pitch);
            return setLowerBeads(prev, rodIndex, Math.min(prev[rodIndex].lower, beadIndex));
          });
        }
      }
    }
  };

  // Colors for the 4 lower beads matching the photo: row 0 = Green, row 1 = Yellow, row 2 = Orange, row 3 = Red
  const lowerColors: BeadColorType[] = ['green', 'yellow', 'orange', 'red'];

  return (
    <div
      onPointerUp={handlePointerUp}
      className="flex flex-col items-center justify-between w-full max-w-5xl mx-auto px-2 sm:px-4 py-1 select-none flex-1 h-full min-h-0"
    >
      {/* Top Header: Addition Challenge & Random Button */}
      <div className="w-full flex flex-col items-center gap-2 mb-1.5">
        {/* Controls Bar: Random Button, Level Selector, Rules */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1">
          {/* Nuova Somma (Random) Button */}
          <button
            onClick={() => generateNewChallenge()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all border border-amber-300"
          >
            <Dice5 className="w-4 h-4" />
            <span>Nuova Somma 🎲</span>
          </button>

          {/* Level Switcher */}
          <div className="flex items-center bg-stone-900/70 p-1 rounded-xl border border-white/10 text-xs font-bold text-stone-300">
            <button
              onClick={() => handleLevelChange('easy')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                level === 'easy' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              Facile (≤20)
            </button>
            <button
              onClick={() => handleLevelChange('medium')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                level === 'medium' ? 'bg-amber-600 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              Medio (≤100)
            </button>
            <button
              onClick={() => handleLevelChange('hard')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                level === 'hard' ? 'bg-red-600 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              Campione (≤1000)
            </button>
          </div>

          {/* Streak & Rules */}
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Risolte: {streak}</span>
              </div>
            )}
            <button
              onClick={onOpenRules}
              title="Come funziona il Soroban"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Challenge Box: The Equation & Secret Result */}
        <div
          className={`w-full py-2 px-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xl border transition-all ${
            isSolved
              ? 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/90 to-emerald-950/80 border-emerald-400/60 shadow-emerald-500/20'
              : 'bg-stone-900/80 border-white/15'
          }`}
        >
          {/* Equation Display */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            <span className="text-white drop-shadow">{challenge.num1}</span>
            <span className="text-amber-400">+</span>
            <span className="text-white drop-shadow">{challenge.num2}</span>
            <span className="text-amber-400">=</span>

            {/* Secret Result (revealed ONLY when soroban matches!) */}
            {isSolved ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500 text-stone-950 shadow-lg animate-bounce">
                <span>{challenge.target}</span>
                <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-stone-950" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-12 h-10 sm:w-16 sm:h-12 rounded-xl bg-amber-500/20 text-amber-300 border-2 border-dashed border-amber-400 animate-pulse font-mono text-2xl sm:text-3xl">
                ❓
              </div>
            )}
          </div>

          {/* Status Message & Next Button */}
          <div className="flex items-center gap-3">
            {isSolved ? (
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-black text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                  <span>RISULTATO ESATTO! Bravissimo!</span>
                </span>
                <button
                  onClick={() => generateNewChallenge()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all"
                >
                  Prossima Somma ➡️
                </button>
              </div>
            ) : (
              <span className="text-xs sm:text-sm text-stone-300 font-medium">
                Sposta le pedine dell'abaco per comporre il totale!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: The Rainbow Soroban Frame (Inspired by reference photo) */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto min-h-0">
        <div className="relative w-full max-w-[880px] bg-[#18181b] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border-[8px] sm:border-[12px] border-[#09090b] shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
          {/* Decorative Brass Screws in Corners (matching photo) */}
          <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm border border-amber-900 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-0.5 bg-amber-950 rounded-full" />
          </div>
          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm border border-amber-900 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-0.5 bg-amber-950 rounded-full" />
          </div>
          <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm border border-amber-900 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-0.5 bg-amber-950 rounded-full" />
          </div>
          <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm border border-amber-900 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-0.5 bg-amber-950 rounded-full" />
          </div>

          {/* Inner Abacus Area */}
          <div className="relative bg-[#27272a] rounded-xl overflow-hidden border border-[#3f3f46] shadow-inner">
            {/* The 9 Rods Grid */}
            <div className="grid grid-cols-9 divide-x divide-black/40">
              {rods.map((rod, rIndex) => {
                const rodVal = getRodValue(rod);
                const hasReckoningDot = RECKONING_DOT_INDICES.includes(rIndex);

                return (
                  <div key={rIndex} className="relative flex flex-col items-center">
                    {/* Natural Birch / Light Bamboo Rod Dowel (runs vertically behind beads) */}
                    <div className="absolute top-0 bottom-0 w-2 sm:w-2.5 bg-gradient-to-r from-[#d97706] via-[#fef3c7] to-[#b45309] rounded-full shadow-inner pointer-events-none z-0" />

                    {/* UPPER DECK: Royal Blue Heaven Bead (Value: 5) */}
                    {/* Height: 68px. Inactive: top: 2px. Active: top: 38px (against beam) */}
                    <div className="relative w-full h-[68px] sm:h-[76px] flex flex-col justify-start z-10 px-0.5 sm:px-1">
                      <div
                        style={{
                          transform: rod.upper ? 'translateY(36px)' : 'translateY(2px)',
                          transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      >
                        <SorobanBead
                          color="blue"
                          isActive={rod.upper}
                          isUpper={true}
                          onClick={() => onUpperBeadClick(rIndex)}
                          onPointerDown={(e) => handlePointerDown(e, rIndex, 'upper')}
                        />
                      </div>
                    </div>

                    {/* HORIZONTAL RECKONING BEAM (Hari) with Brass Rivets */}
                    <div className="relative w-full h-4 sm:h-5 bg-[#09090b] shadow-md border-y border-[#3f3f46] flex items-center justify-center z-20">
                      {/* Brass screw / reckoning dot matching reference photo */}
                      {hasReckoningDot ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-100 via-amber-300 to-amber-600 shadow-[0_0_4px_rgba(251,191,36,0.8)] border border-amber-900" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-700/60" />
                      )}
                    </div>

                    {/* LOWER DECK: Rainbow Earth Beads (Green, Yellow, Orange, Red: value 1 each) */}
                    {/* Height: 160px. Inactive: stacked at bottom. Active: stacked at beam. */}
                    <div className="relative w-full h-[158px] sm:h-[174px] z-10 px-0.5 sm:px-1 overflow-hidden">
                      {[0, 1, 2, 3].map((bIndex) => {
                        const isBeadActive = bIndex < rod.lower;
                        const beadHeight = 28;
                        const translateY = isBeadActive
                          ? bIndex * beadHeight + 2
                          : 158 - (4 - bIndex) * beadHeight - 2;

                        return (
                          <div
                            key={bIndex}
                            className="absolute inset-x-0.5 sm:inset-x-1"
                            style={{
                              transform: `translateY(${translateY}px)`,
                              transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                          >
                            <SorobanBead
                              color={lowerColors[bIndex]}
                              isActive={isBeadActive}
                              isUpper={false}
                              onClick={() => onLowerBeadClick(rIndex, bIndex)}
                              onPointerDown={(e) => handlePointerDown(e, rIndex, 'lower', bIndex)}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Rod Digit Value Pill at Bottom */}
                    <div className="w-full py-1 bg-[#18181b] border-t border-[#3f3f46] flex flex-col items-center justify-center z-20">
                      <span className="font-mono font-bold text-xs sm:text-sm text-amber-200">
                        {rodVal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rod Multiplier Labels Below Frame */}
          <div className="grid grid-cols-9 mt-1.5 px-0.5 text-center">
            {ROD_LABELS.map((label, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-[9px] sm:text-[11px] font-bold text-amber-300/80 tracking-wider">
                  {label}
                </span>
                <span className="text-[8px] text-stone-400 hidden md:inline">
                  {idx === 8 ? 'Unità' : idx === 7 ? 'Decine' : idx === 6 ? 'Centinaia' : idx === 5 ? 'Migliaia' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Tool Bar: Reset, Helper Eye, Value */}
      <div className="w-full flex items-center justify-between gap-2 px-2 py-1 mt-1">
        {/* Reset Soroban to 0 */}
        <button
          onClick={handleResetSoroban}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-white/10 text-xs font-bold shadow active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Azzera Abaco (0)</span>
        </button>

        {/* Color Legend for Children */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-stone-300 font-bold bg-stone-900/60 px-3 py-1 rounded-xl border border-white/10">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Blu = 5
          </span>
          <span className="text-stone-500">·</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Verde = 1
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Giallo = 1
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Arancio = 1
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Rosso = 1
          </span>
        </div>

        {/* Value helper eye */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelperValue((prev) => !prev)}
            title={showHelperValue ? 'Nascondi valore' : 'Mostra valore abaco'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              showHelperValue
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                : 'bg-stone-800/80 text-stone-400 border-white/10 hover:text-white'
            }`}
          >
            {showHelperValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showHelperValue ? 'Nascondi Totale' : 'Mostra Totale'}</span>
          </button>

          {showHelperValue && (
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-amber-300 font-mono text-sm font-black">
              Totale: {sorobanValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
