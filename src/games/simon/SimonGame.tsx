import React, { useState, useEffect, useRef } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
import {
  SimonColor,
  SimonState,
  createInitialSimonState,
  generateNextSimonColor,
  SIMON_TONES,
} from './simonEngine';
import { Play, RotateCw, Volume2, Trophy, Star } from 'lucide-react';

interface SimonGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const SimonGame: React.FC<SimonGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<SimonState>(createInitialSimonState());
  const [activePad, setActivePad] = useState<SimonColor | null>(null);
  const isPlayingRef = useRef(false);

  // Speed based on difficulty
  const toneDuration = difficulty === 'easy' ? 0.45 : difficulty === 'medium' ? 0.35 : 0.25;
  const pauseDuration = difficulty === 'easy' ? 450 : difficulty === 'medium' ? 350 : 250;

  // Start new round
  const startNewGame = () => {
    sound.playTick();
    const firstColor = generateNextSimonColor();
    const newState: SimonState = {
      sequence: [firstColor],
      playerInput: [],
      isPlayingSequence: true,
      activeColor: null,
      score: 0,
      highScore: gameState.highScore,
      gameOver: false,
      message: 'Guarda e ascolta attentamente... 👀🎶',
    };
    setGameState(newState);
    playSequence([firstColor]);
  };

  // Play audio and visual sequence to the player
  const playSequence = async (seq: SimonColor[]) => {
    isPlayingRef.current = true;
    for (let i = 0; i < seq.length; i++) {
      await new Promise((r) => setTimeout(r, pauseDuration));
      const color = seq[i];
      setActivePad(color);
      sound.playTone(SIMON_TONES[color], toneDuration, 'sine');
      await new Promise((r) => setTimeout(r, toneDuration * 1000));
      setActivePad(null);
    }
    isPlayingRef.current = false;
    setGameState((prev) => ({
      ...prev,
      isPlayingSequence: false,
      message: 'Ora tocca a te! Ripeti la sequenza! 👆',
    }));
  };

  // Player clicks a color pad
  const handlePadClick = (color: SimonColor) => {
    if (gameState.isPlayingSequence || gameState.gameOver || gameState.sequence.length === 0) return;

    // Visual & audio feedback
    setActivePad(color);
    sound.playTone(SIMON_TONES[color], 0.2, 'sine');
    setTimeout(() => setActivePad(null), 200);

    const nextInput = [...gameState.playerInput, color];
    const currentIndex = nextInput.length - 1;

    // Check correctness
    if (gameState.sequence[currentIndex] !== color) {
      // Mistake!
      sound.playMiss();
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        message: 'Oh no! Colore sbagliato! Riprova per battere il tuo record! ⭐',
        highScore: Math.max(prev.highScore, prev.score),
      }));
      return;
    }

    // Correct so far
    if (nextInput.length === gameState.sequence.length) {
      // Completed current sequence!
      const newScore = gameState.score + 1;
      sound.playWin();

      const nextSequence = [...gameState.sequence, generateNextSimonColor()];
      setGameState((prev) => ({
        ...prev,
        score: newScore,
        playerInput: [],
        sequence: nextSequence,
        isPlayingSequence: true,
        highScore: Math.max(prev.highScore, newScore),
        message: `Bravissimo! Livello ${newScore + 1}! 🎉`,
      }));

      setTimeout(() => {
        playSequence(nextSequence);
      }, 1000);
    } else {
      setGameState((prev) => ({
        ...prev,
        playerInput: nextInput,
      }));
    }
  };

  const p1Name = 'Bambino (Campione)';
  const p2Name = playMode === 'bot' ? 'Simon (Maestro dei Suoni)' : 'Giocatore 2';

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-[min(94vw,76vh)] mx-auto px-2 sm:px-4 flex-1 h-full min-h-0 select-none">
      {/* Top Player Indicator */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#a855f7"
        pieceIcon={<span className="text-sm">🎶</span>}
        isCurrentTurn={gameState.isPlayingSequence}
        isFlipped={playMode === 'local_pvp'}
        score={`Record: ${gameState.highScore} ⭐`}
      />

      {/* Main Console Arena */}
      <div
        className={`game-board-container relative w-full aspect-square my-auto p-4 sm:p-6 rounded-3xl shadow-2xl transition-transform flex items-center justify-center ${
          isTabletFlipped ? 'rotate-180' : ''
        }`}
        style={{ backgroundColor: '#18181b' }}
      >
        {/* Circular Simon Console Container */}
        <div className="relative w-full h-full rounded-full p-3 sm:p-5 bg-gradient-to-tr from-stone-900 to-stone-800 shadow-2xl border-4 border-stone-700 flex items-center justify-center">
          {/* 4 Color Quadrants */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 w-full h-full rounded-full overflow-hidden">
            {/* GREEN (Top Left) */}
            <button
              onClick={() => handlePadClick('green')}
              disabled={gameState.isPlayingSequence || gameState.sequence.length === 0}
              className={`rounded-tl-full transition-all duration-150 relative border-4 border-stone-900 ${
                activePad === 'green'
                  ? 'bg-emerald-300 scale-98 ring-8 ring-emerald-400 shadow-[0_0_50px_rgba(52,211,153,1)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-inner'
              }`}
            >
              <span className="absolute top-4 left-4 text-xs sm:text-sm font-black text-white/80">
                VERDE 🟢
              </span>
            </button>

            {/* RED (Top Right) */}
            <button
              onClick={() => handlePadClick('red')}
              disabled={gameState.isPlayingSequence || gameState.sequence.length === 0}
              className={`rounded-tr-full transition-all duration-150 relative border-4 border-stone-900 ${
                activePad === 'red'
                  ? 'bg-rose-300 scale-98 ring-8 ring-rose-400 shadow-[0_0_50px_rgba(244,63,94,1)]'
                  : 'bg-rose-600 hover:bg-rose-500 active:scale-95 shadow-inner'
              }`}
            >
              <span className="absolute top-4 right-4 text-xs sm:text-sm font-black text-white/80">
                ROSSO 🔴
              </span>
            </button>

            {/* YELLOW (Bottom Left) */}
            <button
              onClick={() => handlePadClick('yellow')}
              disabled={gameState.isPlayingSequence || gameState.sequence.length === 0}
              className={`rounded-bl-full transition-all duration-150 relative border-4 border-stone-900 ${
                activePad === 'yellow'
                  ? 'bg-amber-200 scale-98 ring-8 ring-amber-400 shadow-[0_0_50px_rgba(251,191,36,1)]'
                  : 'bg-amber-500 hover:bg-amber-400 active:scale-95 shadow-inner'
              }`}
            >
              <span className="absolute bottom-4 left-4 text-xs sm:text-sm font-black text-white/80">
                GIALLO 🟡
              </span>
            </button>

            {/* BLUE (Bottom Right) */}
            <button
              onClick={() => handlePadClick('blue')}
              disabled={gameState.isPlayingSequence || gameState.sequence.length === 0}
              className={`rounded-br-full transition-all duration-150 relative border-4 border-stone-900 ${
                activePad === 'blue'
                  ? 'bg-sky-200 scale-98 ring-8 ring-sky-400 shadow-[0_0_50px_rgba(56,189,248,1)]'
                  : 'bg-sky-600 hover:bg-sky-500 active:scale-95 shadow-inner'
              }`}
            >
              <span className="absolute bottom-4 right-4 text-xs sm:text-sm font-black text-white/80">
                BLU 🔵
              </span>
            </button>
          </div>

          {/* Center Hub Display */}
          <div className="absolute w-[38%] h-[38%] rounded-full bg-stone-950 border-4 border-stone-800 shadow-2xl flex flex-col items-center justify-center p-3 text-center z-20">
            {gameState.sequence.length === 0 ? (
              <button
                onClick={startNewGame}
                className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 animate-pulse"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>INIZIA</span>
              </button>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-widest">
                  PUNTEGGIO
                </span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                  {gameState.score}
                </span>
                <div className="flex items-center gap-1 mt-0.5 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="text-[11px] font-bold">LIV {gameState.score + 1}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Message & Controls */}
      <div className="w-full flex items-center justify-between gap-2 px-2 py-1.5 bg-black/10 dark:bg-white/10 rounded-2xl">
        <div className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 truncate">
          {gameState.message}
        </div>

        <button
          onClick={startNewGame}
          className="p-2 sm:p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1 shrink-0"
        >
          <RotateCw className="w-4 h-4" />
          <span>Ricomincia</span>
        </button>
      </div>

      {/* Bottom Player Indicator */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        pieceIcon={<span className="text-sm">⭐</span>}
        isCurrentTurn={!gameState.isPlayingSequence && gameState.sequence.length > 0 && !gameState.gameOver}
        isFlipped={false}
        score={`Sequenza: ${gameState.playerInput.length}/${gameState.sequence.length}`}
      />

      {/* Victory / Game Over Modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle="Partita Conclusa! 🎶"
        winnerSubtitle={`Bravissimo! Hai completato una sequenza di ${gameState.score} colori! Vuoi riprovare per fare ancora meglio?`}
        onRematch={startNewGame}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
