import React, { useState, useEffect, useRef } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
import {
  GooseState,
  createInitialGooseState,
  calculateGooseMove,
  SPECIAL_TILES,
  GOOSE_BOARD_SIZE,
} from './gooseEngine';
import { Sparkles, RotateCw, Dices } from 'lucide-react';

interface GooseGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

// Dice face dots component
const DiceFace: React.FC<{ value: number; rolling: boolean }> = ({ value, rolling }) => {
  const getDots = (v: number) => {
    switch (v) {
      case 1:
        return [4];
      case 2:
        return [0, 8];
      case 3:
        return [0, 4, 8];
      case 4:
        return [0, 2, 6, 8];
      case 5:
        return [0, 2, 4, 6, 8];
      case 6:
        return [0, 2, 3, 5, 6, 8];
      default:
        return [4];
    }
  };

  const activeDots = getDots(value);

  return (
    <div
      className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-white border-2 border-stone-300 shadow-xl flex items-center justify-center p-2 transition-transform duration-300 ${
        rolling ? 'animate-spin scale-110' : 'hover:scale-105 active:scale-95'
      }`}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && (
              <div
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 rounded-full ${
                  value === 1 ? 'bg-rose-500 scale-125' : 'bg-stone-900'
                } shadow-sm`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const GooseGame: React.FC<GooseGameProps> = ({
  playMode,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<GooseState>(createInitialGooseState());
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [displayDice, setDisplayDice] = useState<number>(1);
  const isBotThinkingRef = useRef(false);

  const activeTurn = gameState.turn;
  const isP1Turn = activeTurn === 0;
  const isBotTurn = playMode === 'bot' && activeTurn === 1;

  // Bot Turn trigger
  useEffect(() => {
    if (isBotTurn && !gameState.gameOver && !isRolling && !isMoving) {
      isBotThinkingRef.current = true;
      const timer = setTimeout(() => {
        handleRollDice();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.gameOver, isBotTurn, isRolling, isMoving]);

  const handleRollDice = () => {
    if (isRolling || isMoving || gameState.gameOver) return;

    // Check if current player must skip turn (Locanda / Pozzo)
    if (gameState.skipTurns[activeTurn] > 0) {
      sound.playMiss();
      setGameState((prev) => {
        const nextSkips = [...prev.skipTurns] as [number, number];
        nextSkips[activeTurn] -= 1;
        const playerName = activeTurn === 0 ? 'Giocatore 1' : playMode === 'bot' ? 'Il BOT' : 'Giocatore 2';
        return {
          ...prev,
          skipTurns: nextSkips,
          turn: activeTurn === 0 ? 1 : 0,
          lastSpecialMessage: `${playerName} era in pausa per la merenda o il pozzo! Salta questo turno.`,
        };
      });
      return;
    }

    setIsRolling(true);
    sound.playDice();

    // Fast dice cycling animation
    let count = 0;
    const interval = setInterval(() => {
      setDisplayDice(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 7) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDisplayDice(finalRoll);
        setIsRolling(false);
        applyRoll(finalRoll);
      }
    }, 80);
  };

  const applyRoll = async (dice: number) => {
    setIsMoving(true);
    const startPos = gameState.positions[activeTurn];

    // Build the sequential list of tiles to step on
    const steps: number[] = [];
    let curr = startPos;
    let forward = true;

    for (let i = 0; i < dice; i++) {
      if (forward) {
        if (curr < GOOSE_BOARD_SIZE) {
          curr += 1;
        } else {
          // Bounced off end
          curr -= 1;
          forward = false;
        }
      } else {
        curr -= 1;
      }
      steps.push(curr);
    }

    // Step-by-step animation for initial dice roll
    for (const stepTile of steps) {
      await new Promise((r) => setTimeout(r, 220));
      sound.playMove();
      setGameState((prev) => {
        const nextPos = [...prev.positions] as [number, number];
        nextPos[activeTurn] = stepTile;
        return { ...prev, positions: nextPos };
      });
    }

    const firstLanding = steps[steps.length - 1];

    // Check special tile at first landing
    const { finalPos, message, specialType } = calculateGooseMove(startPos, dice);

    if (finalPos !== firstLanding) {
      // Need a second movement (e.g. Oca double jump, Bridge to 12, Spring +3)
      await new Promise((r) => setTimeout(r, 450));
      sound.playCapture();
      setGameState((prev) => ({ ...prev, lastSpecialMessage: message }));

      // Animate secondary jump step-by-step
      const secondarySteps: number[] = [];
      let sCurr = firstLanding;
      const sDir = finalPos > firstLanding ? 1 : -1;
      while (sCurr !== finalPos) {
        sCurr += sDir;
        secondarySteps.push(sCurr);
      }

      for (const sTile of secondarySteps) {
        await new Promise((r) => setTimeout(r, 180));
        sound.playMove();
        setGameState((prev) => {
          const nextPos = [...prev.positions] as [number, number];
          nextPos[activeTurn] = sTile;
          return { ...prev, positions: nextPos };
        });
      }
    } else {
      if (specialType === 'inn' || specialType === 'well') {
        sound.playMiss();
      } else if (finalPos === GOOSE_BOARD_SIZE) {
        sound.playWin();
      } else {
        sound.playStone();
      }
    }

    const isWin = finalPos === GOOSE_BOARD_SIZE;
    if (isWin) {
      sound.playWin();
    }

    setGameState((prev) => {
      const newSkips = [...prev.skipTurns] as [number, number];
      if (specialType === 'inn' || specialType === 'well') {
        newSkips[activeTurn] = 1;
      }

      return {
        ...prev,
        skipTurns: newSkips,
        lastDice: dice,
        turn: isWin ? activeTurn : activeTurn === 0 ? 1 : 0,
        gameOver: isWin,
        winner: isWin ? activeTurn : null,
        lastSpecialMessage: message,
      };
    });

    setIsMoving(false);
    isBotThinkingRef.current = false;
  };

  const handleRestart = () => {
    sound.playTick();
    setGameState(createInitialGooseState());
    setDisplayDice(1);
    setIsRolling(false);
    setIsMoving(false);
  };

  const p1Name = 'Papera Gialla 🐥 (G1)';
  const p2Name = playMode === 'bot' ? 'Ochetta Rosa 🪿 (BOT)' : 'Ochetta Rosa 🪿 (G2)';

  // Build the 31-tile track (0..30)
  const trackTiles = Array.from({ length: GOOSE_BOARD_SIZE + 1 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-5xl md:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 flex-1 h-full min-h-0 select-none">
      {/* Top Player Indicator (P2 / BOT: flipped in 1v1 tabletop mode) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#ec4899"
        pieceIcon={<span className="text-sm">🪿</span>}
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Casella: ${gameState.positions[1]}/30`}
      />

      {/* Main Board Meadow Track */}
      <div
        className="w-full my-auto p-3 sm:p-5 md:p-6 rounded-3xl shadow-2xl flex flex-col justify-between transition-all"
        style={{ backgroundColor: '#78ab67' }}
      >
        {/* Track Grid: Winding Meadow Path of 30 tiles */}
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-11 gap-1.5 sm:gap-2.5 w-full bg-emerald-950/25 p-2.5 sm:p-4 rounded-2xl border-2 border-emerald-900/40">
          {trackTiles.map((idx) => {
            const isP1Here = gameState.positions[0] === idx;
            const isP2Here = gameState.positions[1] === idx;
            const special = SPECIAL_TILES[idx];

            let bgClass = 'bg-[#f7f2e7] text-stone-800 border-amber-900/20';
            if (idx === 0) {
              bgClass = 'bg-amber-300 text-amber-950 border-amber-500 font-black';
            } else if (idx === 30) {
              bgClass = 'bg-yellow-400 text-yellow-950 border-yellow-600 ring-2 ring-yellow-300 font-black';
            } else if (special) {
              if (special.type === 'goose') bgClass = 'bg-emerald-200 text-emerald-950 border-emerald-500 font-bold';
              else if (special.type === 'bridge') bgClass = 'bg-sky-200 text-sky-950 border-sky-400 font-bold';
              else if (special.type === 'spring') bgClass = 'bg-amber-200 text-amber-950 border-amber-400 font-bold';
              else if (special.type === 'inn') bgClass = 'bg-rose-200 text-rose-950 border-rose-400 font-bold';
              else if (special.type === 'well') bgClass = 'bg-orange-200 text-orange-950 border-orange-400 font-bold';
            }

            return (
              <div
                key={idx}
                className={`relative aspect-square rounded-xl sm:rounded-2xl border flex flex-col items-center justify-between p-1 transition-all shadow-sm ${bgClass}`}
              >
                {/* Tile Number Header */}
                <div className="flex items-center justify-between w-full text-[10px] sm:text-xs font-black opacity-80 leading-none">
                  <span>{idx === 0 ? 'START' : idx === 30 ? 'ARRIVO' : idx}</span>
                  {special && <span className="text-xs sm:text-sm">{special.emoji}</span>}
                </div>

                {/* Center Graphic */}
                <div className="flex items-center justify-center flex-1 my-0.5">
                  {idx === 0 && <span className="text-xl sm:text-2xl">🌻</span>}
                  {idx === 30 && <span className="text-2xl sm:text-3xl animate-bounce">🏆</span>}
                  {special && idx !== 30 && (
                    <span className="text-lg sm:text-xl md:text-2xl drop-shadow-sm">
                      {special.emoji}
                    </span>
                  )}
                  {!special && idx !== 0 && idx !== 30 && (
                    <span className="text-[10px] sm:text-xs text-stone-400 font-bold">
                      {idx}
                    </span>
                  )}
                </div>

                {/* Pawns on this tile */}
                <div className="flex items-center gap-1 justify-center w-full min-h-[18px]">
                  {isP1Here && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center text-xs animate-bounce z-10">
                      🐥
                    </div>
                  )}
                  {isP2Here && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-pink-500 border-2 border-white shadow-md flex items-center justify-center text-xs animate-bounce z-10">
                      🪿
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Center Dashboard: Dice Roller & Story Alert */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 px-2">
          {/* Action Message / Story Box */}
          <div className="flex-1 bg-white/90 dark:bg-stone-900/90 rounded-2xl p-2.5 sm:p-3 border border-emerald-700/30 shadow-md flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
              {gameState.lastSpecialMessage}
            </div>
          </div>

          {/* Big Interactive Dice Roll Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRollDice}
              disabled={isRolling || isMoving || gameState.gameOver || isBotTurn}
              className={`flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all active:scale-95 border-2 ${
                isP1Turn
                  ? 'bg-blue-500 hover:bg-blue-400 text-white border-blue-300 shadow-blue-500/30'
                  : 'bg-pink-500 hover:bg-pink-400 text-white border-pink-300 shadow-pink-500/30'
              } ${isBotTurn ? 'opacity-80 cursor-wait' : 'cursor-pointer'}`}
            >
              <DiceFace value={displayDice} rolling={isRolling} />
              <div className="flex flex-col text-left">
                <span className="text-[11px] opacity-90 uppercase tracking-wider">
                  {isBotTurn ? 'Tocca al BOT...' : isP1Turn ? 'Tocca a Te!' : 'Tocca a G2!'}
                </span>
                <span className="text-base sm:text-lg font-black flex items-center gap-1.5">
                  <Dices className="w-5 h-5" />
                  <span>{isRolling ? 'Lancio...' : 'Lancia il Dado!'}</span>
                </span>
              </div>
            </button>

            <button
              onClick={handleRestart}
              className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-all shadow-md active:scale-95"
              title="Ricomincia"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Player Indicator (P1 / Papera Gialla) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        pieceIcon={<span className="text-sm">🐥</span>}
        isCurrentTurn={gameState.turn === 0 && !gameState.gameOver}
        isFlipped={false}
        score={`Casella: ${gameState.positions[0]}/30`}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 0
            ? 'Vince la Papera Gialla! 🐥🎉'
            : playMode === 'bot'
            ? "Vince l'Ochetta BOT! 🪿🎉"
            : "Vince l'Ochetta Rosa! 🪿🎉"
        }
        winnerSubtitle={
          gameState.winner === 0
            ? playMode === 'bot'
              ? 'Bravissimo! Sei arrivato per primo al Giardino delle Oche battendo il BOT!'
              : 'Complimenti al Giocatore 1!'
            : playMode === 'bot'
            ? "L'ochetta del BOT è arrivata al traguardo. Facciamo un'altra corsa?"
            : 'Complimenti al Giocatore 2!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
