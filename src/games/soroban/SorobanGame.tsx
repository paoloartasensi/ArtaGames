import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PlayMode, Difficulty } from '../../types/game';
import {
  createEmptySoroban,
  getRodValue,
  getSorobanValue,
  numberToSorobanRods,
  generateSorobanChallenge,
  generateAnzanSequence,
  toggleUpperBead,
  handleLowerBeadClick,
  setLowerBeads,
  ROD_COUNT,
  ROD_LABELS,
  RECKONING_DOT_INDICES,
  SorobanDifficulty,
  SorobanChallenge,
  SorobanRod,
  AnzanChallenge,
} from './sorobanEngine';
import { ANZAN_LESSONS } from './anzanLessons';
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
  Brain,
  GraduationCap,
  Calculator,
  Play,
  Flame,
  XCircle,
  Lightbulb,
  Delete,
} from 'lucide-react';

interface SorobanGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

type BeadColorType = 'blue' | 'green' | 'yellow' | 'orange' | 'red';
type MainTab = 'challenges' | 'anzan' | 'school' | 'free';

interface BeadColorPalette {
  topGrad: [string, string, string];
  botGrad: [string, string, string];
  stroke: string;
  ridgeHighlight: string;
}

const BEAD_PALETTES: Record<BeadColorType, BeadColorPalette> = {
  blue: {
    topGrad: ['#93c5fd', '#3b82f6', '#1d4ed8'],
    botGrad: ['#1d4ed8', '#1e3a8a', '#172554'],
    stroke: '#0f172a',
    ridgeHighlight: '#dbeafe',
  },
  green: {
    topGrad: ['#bbf7d0', '#22c55e', '#16a34a'],
    botGrad: ['#16a34a', '#15803d', '#052e16'],
    stroke: '#022c22',
    ridgeHighlight: '#dcfce7',
  },
  yellow: {
    topGrad: ['#fef08a', '#eab308', '#ca8a04'],
    botGrad: ['#ca8a04', '#a16207', '#713f12'],
    stroke: '#451a03',
    ridgeHighlight: '#fef9c3',
  },
  orange: {
    topGrad: ['#fed7aa', '#f97316', '#ea580c'],
    botGrad: ['#ea580c', '#9a3412', '#7c2d12'],
    stroke: '#431407',
    ridgeHighlight: '#ffedd5',
  },
  red: {
    topGrad: ['#fecaca', '#ef4444', '#dc2626'],
    botGrad: ['#dc2626', '#991b1b', '#450a0a'],
    stroke: '#450a0a',
    ridgeHighlight: '#fee2e2',
  },
};

// Physical dimensions for bead movement (Strict zero-overlap math)
const UPPER_DECK_H = 56;
const LOWER_DECK_H = 136;
const BEAD_H = 24;

const SorobanBead: React.FC<{
  color: BeadColorType;
  isActive: boolean;
  isUpper?: boolean;
  isGhost?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: () => void;
}> = ({ color, isActive, isUpper, isGhost, onPointerDown, onClick }) => {
  const palette = BEAD_PALETTES[color];
  const gradIdTop = `top-${color}-${isUpper ? 'u' : 'l'}${isGhost ? '-g' : ''}`;
  const gradIdBot = `bot-${color}-${isUpper ? 'u' : 'l'}${isGhost ? '-g' : ''}`;

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{ height: `${BEAD_H}px` }}
      className={`relative w-full cursor-pointer select-none touch-none flex items-center justify-center active:scale-95 px-0.5 ${
        isGhost ? 'opacity-35 hover:opacity-60' : ''
      }`}
      role="button"
      tabIndex={0}
      aria-label={`${color} bead`}
    >
      <svg
        viewBox="0 0 60 24"
        className="w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] overflow-visible"
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

        <polygon
          points="30,2 58,12 2,12"
          fill={`url(#${gradIdTop})`}
          stroke={palette.stroke}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <polygon
          points="2,12 58,12 30,22"
          fill={`url(#${gradIdBot})`}
          stroke={palette.stroke}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <line
          x1="3"
          y1="12"
          x2="57"
          y2="12"
          stroke={palette.ridgeHighlight}
          strokeWidth="1.2"
          strokeOpacity={isActive ? 0.95 : 0.75}
        />
        <circle cx="30" cy="12" r="2.2" fill="#d97706" stroke={palette.stroke} strokeWidth="0.8" />
      </svg>
    </div>
  );
};

export const SorobanGame: React.FC<SorobanGameProps> = ({
  difficulty: initialDifficulty,
  onOpenRules,
}) => {
  // Navigation & Modes
  const [activeTab, setActiveTab] = useState<MainTab>('challenges');
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  const [schoolSubView, setSchoolSubView] = useState<'lesson' | 'abacus'>('lesson');

  // Difficulty & Operation
  const [level, setLevel] = useState<SorobanDifficulty>(() => {
    if (initialDifficulty === 'easy') return 'easy';
    if (initialDifficulty === 'hard' || initialDifficulty === 'master') return 'hard';
    return 'medium';
  });
  const [selectedOp, setSelectedOp] = useState<'+' | '-' | '×' | 'mixed'>('+');

  // Interactive Soroban state
  const [rods, setRods] = useState<SorobanRod[]>(() => createEmptySoroban(ROD_COUNT));
  const [challenge, setChallenge] = useState<SorobanChallenge>(() =>
    generateSorobanChallenge('+', level)
  );
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [showHelperValue, setShowHelperValue] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [showHintTip, setShowHintTip] = useState<boolean>(false);

  // --- ANZAN (Mental Math) State ---
  const [anzanChallenge, setAnzanChallenge] = useState<AnzanChallenge>(() =>
    generateAnzanSequence('easy')
  );
  const [anzanSpeedMs, setAnzanSpeedMs] = useState<number>(2000);
  const [anzanIsRunning, setAnzanIsRunning] = useState<boolean>(false);
  const [anzanCurrentStepIdx, setAnzanCurrentStepIdx] = useState<number>(-1);
  const [anzanUserAnswer, setAnzanUserAnswer] = useState<string>('');
  const [anzanSubmitted, setAnzanSubmitted] = useState<boolean>(false);
  const [anzanIsCorrect, setAnzanIsCorrect] = useState<boolean | null>(null);
  const [anzanGhostMode, setAnzanGhostMode] = useState<boolean>(false);
  const [anzanStreak, setAnzanStreak] = useState<number>(0);

  // Drag interaction tracking
  const dragRef = useRef<{
    rodIndex: number;
    deck: 'upper' | 'lower';
    beadIndex?: number;
    startY: number;
  } | null>(null);

  const sorobanValue = getSorobanValue(rods);

  // Victory detection
  useEffect(() => {
    if (activeTab === 'challenges' && !isSolved && sorobanValue === challenge.target) {
      setIsSolved(true);
      setStreak((prev) => prev + 1);
      sound.playVictory();

      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.55 },
        });
      } catch {}
    }
  }, [sorobanValue, challenge.target, isSolved, activeTab]);

  // Anzan timer flashing
  useEffect(() => {
    if (!anzanIsRunning) return;

    if (anzanCurrentStepIdx < anzanChallenge.steps.length) {
      sound.playBead(0.85 + (anzanCurrentStepIdx % 4) * 0.15);
      const timer = setTimeout(() => {
        setAnzanCurrentStepIdx((prev) => prev + 1);
      }, anzanSpeedMs);
      return () => clearTimeout(timer);
    } else {
      setAnzanIsRunning(false);
      sound.playMove();
    }
  }, [anzanIsRunning, anzanCurrentStepIdx, anzanChallenge.steps.length, anzanSpeedMs]);

  const generateNewChallenge = (nextOp = selectedOp, nextLevel = level) => {
    const next = generateSorobanChallenge(nextOp, nextLevel, challenge.target);
    setChallenge(next);
    setIsSolved(false);
    setShowHintTip(false);
    sound.playMove();
  };

  const handleLevelChange = (newLevel: SorobanDifficulty) => {
    setLevel(newLevel);
    generateNewChallenge(selectedOp, newLevel);
  };

  const handleOpChange = (newOp: '+' | '-' | '×' | 'mixed') => {
    setSelectedOp(newOp);
    generateNewChallenge(newOp, level);
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

  // Pointer drag gestures
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

    if (Math.abs(diffY) > 12) {
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
          setRods((prev) => {
            sound.playBead(pitch);
            return setLowerBeads(prev, rodIndex, Math.max(prev[rodIndex].lower, beadIndex + 1));
          });
        } else if (diffY > 0 && beadIndex !== undefined) {
          setRods((prev) => {
            sound.playBead(pitch);
            return setLowerBeads(prev, rodIndex, Math.min(prev[rodIndex].lower, beadIndex));
          });
        }
      }
    }
  };

  // Anzan Flash handlers
  const startAnzanRound = () => {
    const seq = generateAnzanSequence(level);
    setAnzanChallenge(seq);
    setAnzanUserAnswer('');
    setAnzanSubmitted(false);
    setAnzanIsCorrect(null);
    setAnzanCurrentStepIdx(0);
    setAnzanIsRunning(true);
    sound.playMove();
  };

  const submitAnzanAnswer = () => {
    const num = parseInt(anzanUserAnswer, 10);
    const correct = num === anzanChallenge.target;
    setAnzanSubmitted(true);
    setAnzanIsCorrect(correct);

    if (correct) {
      setAnzanStreak((prev) => prev + 1);
      sound.playVictory();
      try {
        confetti({
          particleCount: 75,
          spread: 85,
          origin: { y: 0.5 },
        });
      } catch {}
    } else {
      setAnzanStreak(0);
      sound.playStone();
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'DEL') {
      setAnzanUserAnswer((prev) => prev.slice(0, -1));
    } else if (val === 'ENTER') {
      if (anzanUserAnswer.trim()) submitAnzanAnswer();
    } else {
      if (anzanUserAnswer.length < 6) {
        setAnzanUserAnswer((prev) => prev + val);
      }
    }
  };

  const lowerColors: BeadColorType[] = ['green', 'yellow', 'orange', 'red'];

  const getAnzanPedagogicalHint = () => {
    if (challenge.op === '+') {
      const u1 = challenge.num1 % 10;
      const u2 = challenge.num2 % 10;
      if (u1 + u2 >= 10) {
        const comp = 10 - u2;
        return `Regola Amici del 10: Sulle decine aggiungi +1 (+10) e sulle unità togli l'amico del ${u2} (-${comp})!`;
      }
      if (u1 < 5 && u1 + u2 >= 5) {
        const comp = 5 - u2;
        return `Regola Amici del 5: Abbassa il 5 del Cielo (+5) e togli l'amico del ${u2} (-${comp}) con l'indice!`;
      }
      return 'Addizione diretta: alza le pedine inferiori col pollice!';
    }
    if (challenge.op === '-') {
      const u1 = challenge.num1 % 10;
      const u2 = challenge.num2 % 10;
      if (u1 < u2) {
        const comp = 10 - u2;
        return `Prestito Decina: Togli 1 dalla decina (-10) e aggiungi il complemento +${comp} sull'unità!`;
      }
      if (u1 >= 5 && u1 - u2 < 5) {
        const comp = 5 - u2;
        return `Regola Togli 5: Togli la pedina del Cielo (-5) e rimetti +${comp} pedine della Terra!`;
      }
      return 'Sottrazione diretta: allontana le pedine dalla barra con l\'indice!';
    }
    return `Moltiplicazione: ${challenge.num1} × ${challenge.num2}. Moltiplica le decine e poi le unità e posiziona le pedine!`;
  };

  return (
    <div
      onPointerUp={handlePointerUp}
      className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-1 select-none flex flex-col items-center justify-start flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
    >
      {/* Top Header & Navigation Tabs (with safe right margin for USCITA tab button) */}
      <div className="w-full flex items-center justify-between gap-1 sm:gap-2 mb-1.5 border-b border-white/10 pb-1.5 pr-14 sm:pr-16 shrink-0">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'challenges'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'bg-stone-900/60 text-stone-300 hover:text-white border border-white/5'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Sfide Calcolo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('anzan');
              if (!anzanIsRunning && anzanCurrentStepIdx === -1) {
                startAnzanRound();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'anzan'
                ? 'bg-purple-600 text-white shadow-md font-black'
                : 'bg-stone-900/60 text-stone-300 hover:text-white border border-white/5'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-300" />
            <span>Palestra ANZAN</span>
          </button>

          <button
            onClick={() => setActiveTab('school')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'school'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'bg-stone-900/60 text-stone-300 hover:text-white border border-white/5'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Scuola Anzan</span>
          </button>

          <button
            onClick={() => setActiveTab('free')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'free'
                ? 'bg-blue-600 text-white shadow-md font-black'
                : 'bg-stone-900/60 text-stone-300 hover:text-white border border-white/5'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Abaco Libero</span>
          </button>
        </div>

        <button
          onClick={onOpenRules}
          title="Regole e Guida"
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* --- TAB 1: SFIDE CALCOLO --- */}
      {activeTab === 'challenges' && (
        <div className="w-full flex flex-col items-center gap-1.5 mb-1.5 shrink-0">
          {/* Controls Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-1.5 px-1 pr-12 sm:pr-14">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => generateNewChallenge()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow active:scale-95 transition-all border border-amber-300"
              >
                <Dice5 className="w-3.5 h-3.5" />
                <span>Nuova Sfida 🎲</span>
              </button>

              {/* Op selector */}
              <div className="flex items-center bg-stone-900/80 p-0.5 rounded-xl border border-white/10 text-xs font-bold text-stone-300">
                <button
                  onClick={() => handleOpChange('+')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    selectedOp === '+' ? 'bg-amber-500 text-stone-950 font-black' : 'hover:text-white'
                  }`}
                >
                  +
                </button>
                <button
                  onClick={() => handleOpChange('-')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    selectedOp === '-' ? 'bg-amber-500 text-stone-950 font-black' : 'hover:text-white'
                  }`}
                >
                  -
                </button>
                <button
                  onClick={() => handleOpChange('×')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    selectedOp === '×' ? 'bg-amber-500 text-stone-950 font-black' : 'hover:text-white'
                  }`}
                >
                  ×
                </button>
                <button
                  onClick={() => handleOpChange('mixed')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    selectedOp === 'mixed'
                      ? 'bg-amber-500 text-stone-950 font-black'
                      : 'hover:text-white'
                  }`}
                >
                  Miste
                </button>
              </div>
            </div>

            {/* Level switch */}
            <div className="flex items-center bg-stone-900/70 p-0.5 rounded-xl border border-white/10 text-xs font-bold text-stone-300">
              <button
                onClick={() => handleLevelChange('easy')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  level === 'easy' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-white'
                }`}
              >
                Base (≤20)
              </button>
              <button
                onClick={() => handleLevelChange('medium')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  level === 'medium' ? 'bg-amber-600 text-white shadow-sm' : 'hover:text-white'
                }`}
              >
                Medio (≤100)
              </button>
              <button
                onClick={() => handleLevelChange('hard')}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  level === 'hard' ? 'bg-red-600 text-white shadow-sm' : 'hover:text-white'
                }`}
              >
                Campione (≤1000)
              </button>
            </div>

            {streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Risolte: {streak}</span>
              </div>
            )}
          </div>

          {/* Equation Box with Secret Result */}
          <div
            className={`w-full py-1.5 px-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-lg border transition-all ${
              isSolved
                ? 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/90 to-emerald-950/80 border-emerald-400/60 shadow-emerald-500/20'
                : 'bg-stone-900/80 border-white/15'
            }`}
          >
            <div className="flex items-center gap-2 text-2xl sm:text-3xl font-black tracking-tight">
              <span className="text-white drop-shadow">{challenge.num1}</span>
              <span className="text-amber-400 px-0.5">{challenge.op}</span>
              <span className="text-white drop-shadow">{challenge.num2}</span>
              <span className="text-amber-400">=</span>

              {isSolved ? (
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-xl bg-emerald-500 text-stone-950 shadow scale-105 transition-transform">
                  <span>{challenge.target}</span>
                  <CheckCircle2 className="w-5 h-5 text-stone-950" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-12 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-dashed border-amber-400 animate-pulse font-mono text-xl">
                  ❓
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHintTip((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all ${
                  showHintTip
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    : 'bg-stone-800 text-stone-400 border-white/10 hover:text-white'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>{showHintTip ? 'Nascondi Trucco' : 'Trucco Anzan'}</span>
              </button>

              {isSolved ? (
                <button
                  onClick={() => generateNewChallenge()}
                  className="px-3 py-1 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs shadow active:scale-95 transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Prossima Sfida ➡️</span>
                </button>
              ) : (
                <span className="text-xs text-stone-400 hidden sm:inline font-medium">
                  Muovi le pedine dell'abaco per comporre il totale!
                </span>
              )}
            </div>
          </div>

          {showHintTip && (
            <div className="w-full p-2 rounded-xl bg-stone-900 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">{getAnzanPedagogicalHint()}</span>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PALESTRA FLASH ANZAN --- */}
      {activeTab === 'anzan' && (
        <div className="w-full flex flex-col items-center gap-1.5 mb-1.5 p-2.5 bg-gradient-to-b from-purple-950/60 via-stone-900/80 to-stone-950/90 rounded-2xl border border-purple-500/30 shadow-lg shrink-0">
          <div className="w-full flex flex-wrap items-center justify-between gap-1.5 pr-12 sm:pr-14">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black text-white">FLASH ANZAN (Calcolo Mentale)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAnzanGhostMode((prev) => !prev)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border transition-all ${
                  anzanGhostMode
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-stone-800 text-stone-400 border-white/10'
                }`}
              >
                <span>👻 Abaco Fantasma</span>
              </button>

              <div className="flex items-center bg-stone-900/80 p-0.5 rounded-lg border border-white/10 text-xs font-bold text-stone-300">
                <button
                  onClick={() => setAnzanSpeedMs(3000)}
                  className={`px-1.5 py-0.5 rounded ${anzanSpeedMs === 3000 ? 'bg-purple-600 text-white' : 'hover:text-white'}`}
                >
                  3s
                </button>
                <button
                  onClick={() => setAnzanSpeedMs(2000)}
                  className={`px-1.5 py-0.5 rounded ${anzanSpeedMs === 2000 ? 'bg-purple-600 text-white' : 'hover:text-white'}`}
                >
                  2s
                </button>
                <button
                  onClick={() => setAnzanSpeedMs(1000)}
                  className={`px-1.5 py-0.5 rounded ${anzanSpeedMs === 1000 ? 'bg-purple-600 text-white' : 'hover:text-white'}`}
                >
                  1s
                </button>
              </div>

              {anzanStreak > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold">
                  <Flame className="w-3 h-3 text-purple-400" />
                  <span>{anzanStreak}</span>
                </div>
              )}
            </div>
          </div>

          {/* Flash Box */}
          <div className="w-full flex flex-col items-center justify-center py-2 px-3 bg-stone-950/80 rounded-xl border border-white/10 h-[76px] sm:h-[84px] relative overflow-hidden">
            {anzanIsRunning ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-purple-300 uppercase">
                  Passo {anzanCurrentStepIdx + 1} di {anzanChallenge.steps.length}
                </span>
                <span className="text-4xl sm:text-5xl font-black text-amber-300 font-mono tracking-tight">
                  {anzanChallenge.steps[anzanCurrentStepIdx]?.display || ''}
                </span>
              </div>
            ) : anzanSubmitted ? (
              <div className="flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-2">
                  {anzanIsCorrect ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm sm:text-base">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>ESATTO! Il totale è {anzanChallenge.target}!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-400 font-black text-sm sm:text-base">
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span>Era {anzanChallenge.target}!</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRods(numberToSorobanRods(anzanChallenge.target));
                      sound.playVictory();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow"
                  >
                    Vedi Abaco 🧮
                  </button>
                  <button
                    onClick={startAnzanRound}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow active:scale-95"
                  >
                    Nuova ➡️
                  </button>
                </div>
              </div>
            ) : anzanCurrentStepIdx >= anzanChallenge.steps.length ? (
              <div className="flex items-center justify-between w-full px-2 gap-2">
                <span className="text-xs font-bold text-purple-300">
                  Qual è il totale mentale?
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-20 px-2 py-1 rounded-lg bg-stone-900 border border-purple-400 text-white font-mono text-center text-lg font-bold">
                    {anzanUserAnswer || '_'}
                  </div>
                  <button
                    onClick={submitAnzanAnswer}
                    disabled={!anzanUserAnswer}
                    className="px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-black text-xs shadow disabled:opacity-40"
                  >
                    Conferma ✅
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full px-3">
                <span className="text-xs text-stone-300">
                  Pronto a visualizzare le pedine nella mente?
                </span>
                <button
                  onClick={startAnzanRound}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Avvia Flash Anzan 🚀</span>
                </button>
              </div>
            )}
          </div>

          {/* Touch Number Pad for iPad/Tablets when awaiting answer */}
          {anzanCurrentStepIdx >= anzanChallenge.steps.length && !anzanSubmitted && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-mono font-bold text-xs sm:text-sm border border-white/10 active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress('DEL')}
                className="px-2 h-7 sm:h-8 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center justify-center active:scale-95"
              >
                <Delete className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: SCUOLA SOROBAN & REGOLE ANZAN --- */}
      {activeTab === 'school' && (
        <div className="w-full flex flex-col gap-1.5 mb-1.5 p-2.5 bg-stone-900/90 rounded-2xl border border-emerald-500/30 shadow-lg shrink-0">
          <div className="w-full flex items-center justify-between gap-1.5 pr-12 sm:pr-14">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {ANZAN_LESSONS.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLessonIdx(idx)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeLessonIdx === idx
                      ? 'bg-emerald-500 text-stone-950 font-black'
                      : 'bg-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  <span>{lesson.icon}</span>
                  <span>{lesson.number}. {lesson.title}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center bg-stone-950 p-0.5 rounded-lg border border-white/10 text-[11px] font-bold">
              <button
                onClick={() => setSchoolSubView('lesson')}
                className={`px-2 py-0.5 rounded ${schoolSubView === 'lesson' ? 'bg-emerald-600 text-white' : 'text-stone-400'}`}
              >
                Lezione
              </button>
              <button
                onClick={() => setSchoolSubView('abacus')}
                className={`px-2 py-0.5 rounded ${schoolSubView === 'abacus' ? 'bg-emerald-600 text-white' : 'text-stone-400'}`}
              >
                Abaco
              </button>
            </div>
          </div>

          {/* Lesson View */}
          {schoolSubView === 'lesson' && ANZAN_LESSONS[activeLessonIdx] && (
            <div className="flex flex-col gap-1.5 text-xs text-stone-200 mt-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-sm">
                  {ANZAN_LESSONS[activeLessonIdx].title}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  {ANZAN_LESSONS[activeLessonIdx].badge}
                </span>
              </div>
              <p className="text-stone-300 leading-snug">
                {ANZAN_LESSONS[activeLessonIdx].description}
              </p>
              <div className="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-200">
                <span className="font-bold text-amber-300">🔑 Regola: </span>
                {ANZAN_LESSONS[activeLessonIdx].keyRule}
              </div>
              <div className="p-1.5 rounded-lg bg-stone-950 border border-white/10 text-stone-300">
                <span className="font-bold text-blue-300">🖐️ Dita: </span>
                {ANZAN_LESSONS[activeLessonIdx].fingersTip}
              </div>

              {ANZAN_LESSONS[activeLessonIdx].table && (
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 mt-0.5">
                  {ANZAN_LESSONS[activeLessonIdx].table?.map((t, tidx) => (
                    <div
                      key={tidx}
                      className="p-1 rounded bg-stone-800 border border-white/5 flex flex-col text-center"
                    >
                      <span className="font-mono font-black text-amber-400 text-[11px]">{t.num}</span>
                      <span className="text-[9px] text-stone-300 font-semibold">{t.rule}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: ABACO LIBERO HEADER --- */}
      {activeTab === 'free' && (
        <div className="w-full flex items-center justify-between gap-2 mb-1.5 px-3 py-1 bg-stone-900/80 rounded-xl border border-white/10 shrink-0 pr-12 sm:pr-14">
          <span className="text-xs font-bold text-stone-300">
            Modalità Libera: Muovi qualsiasi pedina per esplorare o comporre numeri personalizzati!
          </span>
          <button
            onClick={handleResetSoroban}
            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-400/30 text-xs font-bold"
          >
            Azzera (0)
          </button>
        </div>
      )}

      {/* --- CENTER: THE RAINBOW JAPANESE SOROBAN FRAME --- */}
      {/* Show the abacus if not in school lesson view or if school subview is abacus */}
      {(activeTab !== 'school' || schoolSubView === 'abacus') && (
        <div className="w-full flex flex-col items-center justify-center my-auto shrink-0">
          <div
            className={`relative w-full max-w-[820px] bg-[#18181b] p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border-[6px] sm:border-[10px] border-[#09090b] shadow-[0_15px_35px_rgba(0,0,0,0.8)] transition-all ${
              activeTab === 'anzan' && anzanGhostMode ? 'opacity-40' : 'opacity-100'
            }`}
          >
            {/* Decorative Corner Screws */}
            <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm border border-amber-900 flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-0.5 bg-amber-950 rounded-full" />
            </div>
            <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm border border-amber-900 flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-0.5 bg-amber-950 rounded-full" />
            </div>
            <div className="absolute bottom-1 left-1 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm border border-amber-900 flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-0.5 bg-amber-950 rounded-full" />
            </div>
            <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 shadow-sm border border-amber-900 flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-0.5 bg-amber-950 rounded-full" />
            </div>

            {/* Inner Abacus Area */}
            <div className="relative bg-[#27272a] rounded-xl overflow-hidden border border-[#3f3f46] shadow-inner">
              <div className="grid grid-cols-9 divide-x divide-black/40">
                {rods.map((rod, rIndex) => {
                  const rodVal = getRodValue(rod);
                  const hasReckoningDot = RECKONING_DOT_INDICES.includes(rIndex);

                  // Upper bead active is translated down against the beam
                  const upperTranslateY = rod.upper ? UPPER_DECK_H - BEAD_H - 2 : 2;

                  return (
                    <div key={rIndex} className="relative flex flex-col items-center">
                      {/* Natural Birch Rod Dowel */}
                      <div className="absolute top-0 bottom-0 w-2 sm:w-2.5 bg-gradient-to-r from-[#d97706] via-[#fef3c7] to-[#b45309] rounded-full shadow-inner pointer-events-none z-0" />

                      {/* UPPER DECK: Royal Blue Heaven Bead (5) */}
                      <div
                        style={{ height: `${UPPER_DECK_H}px` }}
                        className="relative w-full flex flex-col justify-start z-10 px-0.5 sm:px-1"
                      >
                        <div
                          style={{
                            transform: `translateY(${upperTranslateY}px)`,
                            transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }}
                        >
                          <SorobanBead
                            color="blue"
                            isActive={rod.upper}
                            isUpper={true}
                            isGhost={activeTab === 'anzan' && anzanGhostMode}
                            onClick={() => onUpperBeadClick(rIndex)}
                            onPointerDown={(e) => handlePointerDown(e, rIndex, 'upper')}
                          />
                        </div>
                      </div>

                      {/* HORIZONTAL RECKONING BEAM (Hari) */}
                      <div className="relative w-full h-3.5 sm:h-4 bg-[#09090b] shadow-md border-y border-[#3f3f46] flex items-center justify-center z-20">
                        {hasReckoningDot ? (
                          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-100 via-amber-300 to-amber-600 shadow-[0_0_3px_rgba(251,191,36,0.8)] border border-amber-900" />
                        ) : (
                          <div className="w-1 h-1 rounded-full bg-amber-700/60" />
                        )}
                      </div>

                      {/* LOWER DECK: Rainbow Earth Beads (Green, Yellow, Orange, Red) */}
                      <div
                        style={{ height: `${LOWER_DECK_H}px` }}
                        className="relative w-full z-10 px-0.5 sm:px-1 overflow-hidden"
                      >
                        {[0, 1, 2, 3].map((bIndex) => {
                          const isBeadActive = bIndex < rod.lower;
                          // Exact non-overlapping coordinates:
                          // Active beads stack downward from beam: 2, 26, 50, 74
                          // Inactive beads stack upward from frame bottom: 38, 62, 86, 110
                          const translateY = isBeadActive
                            ? bIndex * BEAD_H + 2
                            : LOWER_DECK_H - (4 - bIndex) * BEAD_H - 2;

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
                                isGhost={activeTab === 'anzan' && anzanGhostMode}
                                onClick={() => onLowerBeadClick(rIndex, bIndex)}
                                onPointerDown={(e) => handlePointerDown(e, rIndex, 'lower', bIndex)}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Rod Digit Value Pill */}
                      <div className="w-full py-0.5 bg-[#18181b] border-t border-[#3f3f46] flex flex-col items-center justify-center z-20">
                        <span className="font-mono font-bold text-xs text-amber-200">
                          {rodVal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rod Multiplier Labels Below Frame */}
            <div className="grid grid-cols-9 mt-1 px-0.5 text-center">
              {ROD_LABELS.map((label, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-300/80 tracking-wider">
                    {label}
                  </span>
                  <span className="text-[8px] text-stone-400 hidden sm:inline">
                    {idx === 8 ? 'Unità' : idx === 7 ? 'Decine' : idx === 6 ? 'Cent.' : idx === 5 ? 'Mila' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tool Bar */}
      <div className="w-full flex items-center justify-between gap-2 px-2 py-1 mt-1 shrink-0">
        <button
          onClick={handleResetSoroban}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-white/10 text-xs font-bold shadow active:scale-95 transition-all"
        >
          <RotateCcw className="w-3 h-3 text-amber-400" />
          <span>Azzera (0)</span>
        </button>

        {/* Color Legend */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-stone-300 font-bold bg-stone-900/60 px-3 py-1 rounded-xl border border-white/10">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Cielo = 5
          </span>
          <span className="text-stone-500">·</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Terra = 1
          </span>
        </div>

        {/* Value helper eye */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelperValue((prev) => !prev)}
            title={showHelperValue ? 'Nascondi valore' : 'Mostra valore abaco'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold transition-all ${
              showHelperValue
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                : 'bg-stone-800/80 text-stone-400 border-white/10 hover:text-white'
            }`}
          >
            {showHelperValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showHelperValue ? 'Nascondi' : 'Mostra Totale'}</span>
          </button>

          {showHelperValue && (
            <div className="px-2.5 py-0.5 rounded-xl bg-black/40 border border-white/10 text-amber-300 font-mono text-xs sm:text-sm font-black">
              Totale: {sorobanValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
