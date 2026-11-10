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
  SorobanOpType,
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
  Volume2,
  XCircle,
  Lightbulb,
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
      className={`relative w-full h-[26px] sm:h-[30px] cursor-pointer select-none touch-none flex items-center justify-center transition-transform active:scale-95 px-0.5 ${
        isGhost ? 'opacity-35 hover:opacity-60' : ''
      }`}
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

        <polygon
          points="30,2 58,13 2,13"
          fill={`url(#${gradIdTop})`}
          stroke={palette.stroke}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <polygon
          points="2,13 58,13 30,24"
          fill={`url(#${gradIdBot})`}
          stroke={palette.stroke}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <line
          x1="3"
          y1="13"
          x2="57"
          y2="13"
          stroke={palette.ridgeHighlight}
          strokeWidth="1.3"
          strokeOpacity={isActive ? 0.95 : 0.75}
        />
        <circle cx="30" cy="13" r="2.2" fill="#d97706" stroke={palette.stroke} strokeWidth="0.8" />
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
  const [anzanSpeedMs, setAnzanSpeedMs] = useState<number>(2000); // 2s per number
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

  // Check victory condition in standard challenges mode
  useEffect(() => {
    if (activeTab === 'challenges' && !isSolved && sorobanValue === challenge.target) {
      setIsSolved(true);
      setStreak((prev) => prev + 1);
      sound.playVictory();

      try {
        confetti({
          particleCount: 75,
          spread: 85,
          origin: { y: 0.55 },
        });
      } catch {}
    }
  }, [sorobanValue, challenge.target, isSolved, activeTab]);

  // Handle Anzan timer flashing
  useEffect(() => {
    if (!anzanIsRunning) return;

    if (anzanCurrentStepIdx < anzanChallenge.steps.length) {
      sound.playBead(0.85 + (anzanCurrentStepIdx % 4) * 0.15);
      const timer = setTimeout(() => {
        setAnzanCurrentStepIdx((prev) => prev + 1);
      }, anzanSpeedMs);
      return () => clearTimeout(timer);
    } else {
      // Sequence completed! Ready for user input
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
          particleCount: 80,
          spread: 90,
          origin: { y: 0.5 },
        });
      } catch {}
    } else {
      setAnzanStreak(0);
      sound.playStone();
    }
  };

  const lowerColors: BeadColorType[] = ['green', 'yellow', 'orange', 'red'];

  // Calculate friendly hint for current challenge
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
      className="flex flex-col items-center justify-between w-full max-w-5xl mx-auto px-2 sm:px-4 py-1 select-none flex-1 h-full min-h-0"
    >
      {/* Top Main Navigation Tabs */}
      <div className="w-full flex items-center justify-between gap-1 sm:gap-2 mb-1.5 border-b border-white/10 pb-1.5">
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
                ? 'bg-purple-500 text-white shadow-md font-black'
                : 'bg-stone-900/60 text-stone-300 hover:text-white border border-white/5'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-amber-300" />
            <span>Palestra ANZAN</span>
            <span className="px-1.5 py-0.2 rounded-md bg-purple-950/60 text-[10px] text-purple-200">
              Mentale
            </span>
          </button>

          <button
            onClick={() => setActiveTab('school')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'school'
                ? 'bg-emerald-500 text-stone-950 shadow-md font-black'
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
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* --- TAB 1: SFIDE CALCOLO (Addizioni, Sottrazioni, Moltiplicazioni, Miste) --- */}
      {activeTab === 'challenges' && (
        <div className="w-full flex flex-col items-center gap-1.5 mb-1.5">
          {/* Controls Bar: Random Button, Op Selector, Level Selector */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => generateNewChallenge()}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all border border-amber-300"
              >
                <Dice5 className="w-4 h-4" />
                <span>Nuova Sfida 🎲</span>
              </button>

              {/* Operation Selector */}
              <div className="flex items-center bg-stone-900/80 p-0.5 rounded-xl border border-white/10 text-xs font-bold text-stone-300">
                <button
                  onClick={() => handleOpChange('+')}
                  title="Solo Addizioni (+)"
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    selectedOp === '+' ? 'bg-amber-500 text-stone-950 font-black' : 'hover:text-white'
                  }`}
                >
                  +
                </button>
                <button
                  onClick={() => handleOpChange('-')}
                  title="Solo Sottrazioni (-)"
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    selectedOp === '-' ? 'bg-amber-500 text-stone-950 font-black' : 'hover:text-white'
                  }`}
                >
                  -
                </button>
                <button
                  onClick={() => handleOpChange('×')}
                  title="Solo Moltiplicazioni (×)"
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    selectedOp === '×' ? 'bg-amber-500 text-stone-950 font-black' : 'hover:text-white'
                  }`}
                >
                  ×
                </button>
                <button
                  onClick={() => handleOpChange('mixed')}
                  title="Miste (+ / - / ×)"
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    selectedOp === 'mixed'
                      ? 'bg-amber-500 text-stone-950 font-black'
                      : 'hover:text-white'
                  }`}
                >
                  Miste
                </button>
              </div>
            </div>

            {/* Level Switcher */}
            <div className="flex items-center bg-stone-900/70 p-1 rounded-xl border border-white/10 text-xs font-bold text-stone-300">
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

            {/* Streak Counter */}
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Risolte: {streak}</span>
              </div>
            )}
          </div>

          {/* Equation Box with Secret Result */}
          <div
            className={`w-full py-1.5 px-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xl border transition-all ${
              isSolved
                ? 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/90 to-emerald-950/80 border-emerald-400/60 shadow-emerald-500/20'
                : 'bg-stone-900/80 border-white/15'
            }`}
          >
            {/* Equation Display */}
            <div className="flex items-center gap-2 sm:gap-3 text-2xl sm:text-3xl font-black tracking-tight">
              <span className="text-white drop-shadow">{challenge.num1}</span>
              <span className="text-amber-400 px-1">{challenge.op}</span>
              <span className="text-white drop-shadow">{challenge.num2}</span>
              <span className="text-amber-400">=</span>

              {/* Secret Result */}
              {isSolved ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500 text-stone-950 shadow-lg animate-bounce">
                  <span>{challenge.target}</span>
                  <CheckCircle2 className="w-6 h-6 text-stone-950" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-12 h-9 sm:w-16 sm:h-11 rounded-xl bg-amber-500/20 text-amber-300 border-2 border-dashed border-amber-400 animate-pulse font-mono text-xl sm:text-2xl">
                  ❓
                </div>
              )}
            </div>

            {/* Hint & Next Button */}
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
                  className="px-3 py-1 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Prossima Sfida ➡️</span>
                </button>
              ) : (
                <span className="text-xs text-stone-300 font-medium hidden sm:inline">
                  Sposta le pedine per ottenere il totale!
                </span>
              )}
            </div>
          </div>

          {/* Anzan Educational Rule Hint Callout */}
          {showHintTip && (
            <div className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-950/60 via-stone-900/90 to-amber-950/60 border border-amber-400/30 text-amber-200 text-xs flex items-center gap-2 shadow-inner">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">{getAnzanPedagogicalHint()}</span>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PALESTRA ANZAN (Flash Anzan & Mental Soroban) --- */}
      {activeTab === 'anzan' && (
        <div className="w-full flex flex-col items-center gap-2 mb-2 p-3 bg-gradient-to-b from-purple-950/50 via-stone-900/80 to-stone-950/90 rounded-2xl border border-purple-500/30 shadow-xl">
          <div className="w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Palestra FLASH ANZAN (暗算)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500 text-white font-bold">
                    Calcolo Mentale
                  </span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  Visualizza le pedine nella mente e calcola senza toccare l'abaco!
                </p>
              </div>
            </div>

            {/* Speed & Ghost Mode Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAnzanGhostMode((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                  anzanGhostMode
                    ? 'bg-purple-500/30 text-purple-200 border-purple-400/50'
                    : 'bg-stone-800 text-stone-400 border-white/10 hover:text-white'
                }`}
                title="L'abaco fantasma è semitrasparente per allenare la vista interiore"
              >
                <span>👻 Abaco Fantasma</span>
                <span
                  className={`w-2 h-2 rounded-full ${anzanGhostMode ? 'bg-purple-400' : 'bg-stone-600'}`}
                />
              </button>

              <div className="flex items-center bg-stone-900/80 p-0.5 rounded-xl border border-white/10 text-xs font-bold text-stone-300">
                <button
                  onClick={() => setAnzanSpeedMs(3000)}
                  className={`px-2 py-1 rounded-lg ${anzanSpeedMs === 3000 ? 'bg-purple-600 text-white' : 'hover:text-white'}`}
                >
                  Lento (3s)
                </button>
                <button
                  onClick={() => setAnzanSpeedMs(2000)}
                  className={`px-2 py-1 rounded-lg ${anzanSpeedMs === 2000 ? 'bg-purple-600 text-white' : 'hover:text-white'}`}
                >
                  Medio (2s)
                </button>
                <button
                  onClick={() => setAnzanSpeedMs(1000)}
                  className={`px-2 py-1 rounded-lg ${anzanSpeedMs === 1000 ? 'bg-purple-600 text-white' : 'hover:text-white'}`}
                >
                  Flash (1s)
                </button>
              </div>

              {anzanStreak > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  <span>Serie: {anzanStreak}</span>
                </div>
              )}
            </div>
          </div>

          {/* The Flash Display Area */}
          <div className="w-full flex flex-col items-center justify-center py-4 bg-stone-950/80 rounded-xl border border-white/10 min-h-[110px] relative overflow-hidden">
            {anzanIsRunning ? (
              <div className="flex flex-col items-center justify-center animate-pulse">
                <span className="text-xs font-bold text-purple-300 tracking-wider uppercase mb-1">
                  Passo {anzanCurrentStepIdx + 1} di {anzanChallenge.steps.length}
                </span>
                <span className="text-5xl sm:text-6xl font-black text-amber-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                  {anzanChallenge.steps[anzanCurrentStepIdx]?.display || ''}
                </span>
                <span className="text-[11px] text-stone-400 mt-1 italic">
                  Muovi le dita nell'aria (pollice = terra, indice = cielo)
                </span>
              </div>
            ) : anzanSubmitted ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  {anzanIsCorrect ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-xl font-black">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <span>ESATTO! Il risultato è {anzanChallenge.target}!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-rose-400 text-xl font-black">
                      <XCircle className="w-6 h-6 text-rose-400" />
                      <span>Quasi! La risposta corretta era {anzanChallenge.target}.</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-300 font-mono">
                  <span>Sequenza:</span>
                  {anzanChallenge.steps.map((s, idx) => (
                    <span key={idx} className="bg-stone-800 px-1.5 py-0.5 rounded border border-white/5">
                      {s.display}
                    </span>
                  ))}
                  <span>= {anzanChallenge.target}</span>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => {
                      // Automatically reflect the correct solution on the soroban so the student can inspect it!
                      setRods(numberToSorobanRods(anzanChallenge.target));
                      sound.playVictory();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all"
                  >
                    Vedi sull'Abaco 🧮
                  </button>
                  <button
                    onClick={startAnzanRound}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow active:scale-95 transition-all"
                  >
                    Nuova Sequenza Anzan ➡️
                  </button>
                </div>
              </div>
            ) : anzanCurrentStepIdx >= anzanChallenge.steps.length ? (
              /* Awaiting user answer */
              <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                <span className="text-xs font-bold text-purple-300">
                  Sequenza completata! Qual è il totale mentale?
                </span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (anzanUserAnswer.trim()) submitAnzanAnswer();
                  }}
                  className="flex items-center gap-2 w-full justify-center"
                >
                  <input
                    type="number"
                    value={anzanUserAnswer}
                    onChange={(e) => setAnzanUserAnswer(e.target.value)}
                    placeholder="Scrivi il risultato..."
                    autoFocus
                    className="w-36 px-3 py-2 rounded-xl bg-stone-900 border-2 border-purple-400 text-white font-mono text-xl text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-sm shadow-lg active:scale-95 transition-all"
                  >
                    Conferma ✅
                  </button>
                </form>
              </div>
            ) : (
              /* Initial state before start */
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-stone-300">
                  Pronto per la sequenza flash di calcolo mentale?
                </span>
                <button
                  onClick={startAnzanRound}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Avvia Flash Anzan 🚀</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: SCUOLA SOROBAN & REGOLE ANZAN --- */}
      {activeTab === 'school' && (
        <div className="w-full flex flex-col gap-2 mb-2 p-3 bg-gradient-to-b from-stone-900 via-stone-900/90 to-stone-950 rounded-2xl border border-emerald-500/30 shadow-xl overflow-y-auto max-h-[220px]">
          {/* Lessons Nav Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ANZAN_LESSONS.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonIdx(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeLessonIdx === idx
                    ? 'bg-emerald-500 text-stone-950 font-black shadow-md'
                    : 'bg-stone-800 text-stone-300 hover:text-white border border-white/5'
                }`}
              >
                <span>{lesson.icon}</span>
                <span>{lesson.number}. {lesson.title}</span>
              </button>
            ))}
          </div>

          {/* Current Lesson Content */}
          {ANZAN_LESSONS[activeLessonIdx] && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{ANZAN_LESSONS[activeLessonIdx].title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                      {ANZAN_LESSONS[activeLessonIdx].badge}
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    {ANZAN_LESSONS[activeLessonIdx].subtitle}
                  </p>
                </div>

                <button
                  onClick={() => {
                    // Load lesson demonstration on soroban
                    if (activeLessonIdx === 1) {
                      setRods(numberToSorobanRods(7));
                    } else if (activeLessonIdx === 2) {
                      setRods(numberToSorobanRods(6));
                    } else if (activeLessonIdx === 3) {
                      setRods(numberToSorobanRods(13));
                    }
                    sound.playBead(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-bold border border-white/10"
                >
                  Mostra sull'Abaco ✨
                </button>
              </div>

              <p className="text-xs text-stone-200 leading-relaxed">
                {ANZAN_LESSONS[activeLessonIdx].description}
              </p>

              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs font-medium">
                <span className="font-bold text-amber-300">🔑 Regola Chiave: </span>
                {ANZAN_LESSONS[activeLessonIdx].keyRule}
              </div>

              <div className="p-2 rounded-xl bg-stone-950 border border-white/10 text-stone-300 text-xs whitespace-pre-line">
                <span className="font-bold text-blue-300">🖐️ Uso delle Dita: </span>
                {ANZAN_LESSONS[activeLessonIdx].fingersTip}
              </div>

              {/* Table of Friends if present */}
              {ANZAN_LESSONS[activeLessonIdx].table && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1">
                  {ANZAN_LESSONS[activeLessonIdx].table?.map((t, tidx) => (
                    <div
                      key={tidx}
                      className="p-1.5 rounded-lg bg-stone-800/80 border border-white/5 flex flex-col text-center"
                    >
                      <span className="text-xs font-mono font-black text-amber-400">{t.num}</span>
                      <span className="text-[10px] text-stone-300 font-semibold">{t.rule}</span>
                      <span className="text-[9px] text-stone-400 font-mono">{t.formula}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: ABACO LIBERO (Free Explorer) --- */}
      {activeTab === 'free' && (
        <div className="w-full flex items-center justify-between gap-2 mb-1.5 px-3 py-1.5 bg-stone-900/80 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-400" />
            <span className="text-xs sm:text-sm font-bold text-stone-200">
              Modalità Libera: Muovi qualsiasi pedina per esplorare o fare calcoli personalizzati!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetSoroban}
              className="px-3 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-400/30 text-xs font-bold"
            >
              Azzera (0)
            </button>
          </div>
        </div>
      )}

      {/* --- CENTER: THE RAINBOW JAPANESE SOROBAN FRAME --- */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto min-h-0">
        <div
          className={`relative w-full max-w-[880px] bg-[#18181b] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border-[8px] sm:border-[12px] border-[#09090b] shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-all ${
            activeTab === 'anzan' && anzanGhostMode ? 'opacity-40' : 'opacity-100'
          }`}
        >
          {/* Decorative Brass Screws in Corners */}
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
                    {/* Natural Birch / Light Bamboo Rod Dowel */}
                    <div className="absolute top-0 bottom-0 w-2 sm:w-2.5 bg-gradient-to-r from-[#d97706] via-[#fef3c7] to-[#b45309] rounded-full shadow-inner pointer-events-none z-0" />

                    {/* UPPER DECK: Royal Blue Heaven Bead (Value: 5) */}
                    <div className="relative w-full h-[66px] sm:h-[74px] flex flex-col justify-start z-10 px-0.5 sm:px-1">
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
                          isGhost={activeTab === 'anzan' && anzanGhostMode}
                          onClick={() => onUpperBeadClick(rIndex)}
                          onPointerDown={(e) => handlePointerDown(e, rIndex, 'upper')}
                        />
                      </div>
                    </div>

                    {/* HORIZONTAL RECKONING BEAM (Hari) with Brass Rivets */}
                    <div className="relative w-full h-4 sm:h-5 bg-[#09090b] shadow-md border-y border-[#3f3f46] flex items-center justify-center z-20">
                      {hasReckoningDot ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-100 via-amber-300 to-amber-600 shadow-[0_0_4px_rgba(251,191,36,0.8)] border border-amber-900" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-700/60" />
                      )}
                    </div>

                    {/* LOWER DECK: Rainbow Earth Beads (Green, Yellow, Orange, Red) */}
                    <div className="relative w-full h-[156px] sm:h-[172px] z-10 px-0.5 sm:px-1 overflow-hidden">
                      {[0, 1, 2, 3].map((bIndex) => {
                        const isBeadActive = bIndex < rod.lower;
                        const beadHeight = 28;
                        const translateY = isBeadActive
                          ? bIndex * beadHeight + 2
                          : 156 - (4 - bIndex) * beadHeight - 2;

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

      {/* Bottom Tool Bar: Reset, Legend, Helper Eye */}
      <div className="w-full flex items-center justify-between gap-2 px-2 py-1 mt-1">
        <button
          onClick={handleResetSoroban}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-white/10 text-xs font-bold shadow active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Azzera Abaco (0)</span>
        </button>

        {/* Color Legend */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-stone-300 font-bold bg-stone-900/60 px-3 py-1 rounded-xl border border-white/10">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Cielo = 5
          </span>
          <span className="text-stone-500">·</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Terra = 1 ciascuna
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
