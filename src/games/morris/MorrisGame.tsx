import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  MorrisState,
  createInitialMorrisState,
  placeMorris,
  removeMorris,
  selectMorris,
  moveMorris,
  getBotMorrisAction,
} from './morrisEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface MorrisGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const POS: [number, number][] = [
  [20, 20], [50, 20], [80, 20], [80, 50], [80, 80], [50, 80], [20, 80], [20, 50],
  [30, 30], [50, 30], [70, 30], [70, 50], [70, 70], [50, 70], [30, 70], [30, 50],
  [40, 40], [50, 40], [60, 40], [60, 50], [60, 60], [50, 60], [40, 60], [40, 50],
];

const SEGMENTS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
  [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
  [0, 8], [8, 16], [1, 9], [9, 17], [2, 10], [10, 18], [3, 11], [11, 19],
  [4, 12], [12, 20], [5, 13], [13, 21], [6, 14], [14, 22], [7, 15], [15, 23],
];

export const MorrisGame: React.FC<MorrisGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<MorrisState>(createInitialMorrisState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 1 && !gameState.gameOver) {
      setIsBotThinking(true);
      const t = setTimeout(() => {
        const action = getBotMorrisAction(gameState, difficulty);
        if (!action) {
          setIsBotThinking(false);
          return;
        }
        if (action.type === 'place') {
          const next = placeMorris(gameState, action.point);
          if (next) {
            sound.playStone();
            setGameState(next);
          }
        } else if (action.type === 'remove') {
          const next = removeMorris(gameState, action.point);
          if (next) {
            sound.playCapture();
            setGameState(next);
          }
        } else {
          const s = selectMorris(gameState, action.from);
          if (s) {
            const m = moveMorris(s, action.to);
            if (m) {
              sound.playStone();
              setGameState(m);
            }
          }
        }
        setIsBotThinking(false);
      }, 650);
      return () => clearTimeout(t);
    }
  }, [gameState, playMode, difficulty]);

  const handlePointClick = (point: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 1) return;

    if (gameState.mustRemove) {
      const next = removeMorris(gameState, point);
      if (next) {
        sound.playCapture();
        setGameState(next);
      }
      return;
    }

    if (gameState.phase === 'placing') {
      const next = placeMorris(gameState, point);
      if (next) {
        sound.playStone();
        setGameState(next);
      }
      return;
    }

    if (gameState.selected === null) {
      const next = selectMorris(gameState, point);
      if (next) setGameState(next);
    } else if (gameState.selected === point) {
      setGameState({ ...gameState, selected: null });
    } else {
      const next = moveMorris(gameState, point);
      if (next) {
        sound.playStone();
        setGameState(next);
      }
    }
  };

  const handleRestart = () => setGameState(createInitialMorrisState());

  const p1Name = 'Blu (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Rosso (BOT)' : 'Rosso (Giocatore 2)';

  const statusText = gameState.mustRemove
    ? 'Hai fatto un Mulino! Tocca un pezzo avversario da rimuovere.'
    : gameState.phase === 'placing'
    ? `${gameState.turn === 0 ? 'Blu' : 'Rosso'} piazza un pezzo (${gameState.piecesToPlace[gameState.turn]} rimasti)`
    : gameState.selected !== null
    ? 'Ora tocca una casella vicina per spostare il pezzo.'
    : `${gameState.turn === 0 ? 'Blu' : 'Rosso'}: tocca un tuo pezzo da muovere.`;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2">
      {/* Turn indicator */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 0 && !gameState.gameOver ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'opacity-70'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-xs font-semibold">{p1Name}</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs font-bold">
            {gameState.piecesOnBoard[0]}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 1 && !gameState.gameOver ? 'ring-2 ring-rose-500 bg-rose-500/10' : 'opacity-70'
          }`}
        >
          <span className="ml-1 px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs font-bold">
            {gameState.piecesOnBoard[1]}
          </span>
          <span className="text-xs font-semibold">{p2Name}</span>
          <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm" />
        </div>
      </div>

      {/* Board */}
      <div
        className={`w-full aspect-square rounded-3xl p-3 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: gameState.gameOver ? theme.boardBg : getTurnColor(gameState.turn, playMode) }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {SEGMENTS.map(([a, b], i) => (
            <line
              key={i}
              x1={POS[a][0]}
              y1={POS[a][1]}
              x2={POS[b][0]}
              y2={POS[b][1]}
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-stone-700 dark:text-stone-200"
              opacity="0.5"
            />
          ))}

          {POS.map(([x, y], i) => {
            const piece = gameState.board[i];
            const isSelected = gameState.selected === i;
            const isLast = gameState.lastMove.to === i;
            const clickable =
              !gameState.gameOver &&
              !isBotThinking &&
              !(playMode === 'bot' && gameState.turn === 1) &&
              (gameState.mustRemove
                ? piece === (1 - gameState.turn)
                : gameState.phase === 'placing'
                ? piece === null
                : piece === gameState.turn || isSelected);

            return (
              <g key={i} onClick={() => handlePointClick(i)} className={clickable ? 'cursor-pointer' : ''}>
                <circle cx={x} cy={y} r={4.5} fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={3.2}
                  fill={piece === null ? 'transparent' : piece === 0 ? '#3b82f6' : '#f43f5e'}
                  stroke={piece === null ? 'none' : '#fff'}
                  strokeWidth="0.6"
                />
                {piece === null && (
                  <circle cx={x} cy={y} r={1.6} fill="rgba(0,0,0,0.25)" />
                )}
                {isSelected && <circle cx={x} cy={y} r={4.5} fill="none" stroke="#f59e0b" strokeWidth="1.4" />}
                {isLast && <circle cx={x} cy={y} r={5} fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.7" />}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-3 text-xs font-semibold text-center text-stone-500 dark:text-stone-400">{statusText}</p>

      {isBotThinking && (
        <div className="mt-2 text-xs font-medium text-amber-500 animate-pulse">Il BOT sta pensando...</div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={gameState.winner === 0 ? 'Vince il Blu! 🎉' : 'Vince il Rosso! 🎉'}
        winnerSubtitle={
          gameState.winner === 0
            ? playMode === 'bot'
              ? 'Hai bloccato o ridotto il BOT a meno di 3 pezzi!'
              : 'Complimenti al Giocatore 1!'
            : playMode === 'bot'
            ? 'Il BOT ha vinto. Rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
