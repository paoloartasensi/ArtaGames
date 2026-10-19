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
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
import { motion } from 'motion/react';
import { SLIDE, FADE, useMoveKey } from '../../utils/animations';

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

  const moveKey = useMoveKey(gameState.lastMove);
  const removedPoint = gameState.lastMove.removed;
  const removedIsPlayer0 =
    removedPoint != null && (gameState.gameOver ? gameState.winner === 1 : gameState.turn === 0);
  const lm = gameState.lastMove;
  const slideFromPos: [number, number] | null = lm.from != null ? POS[lm.from] : null;
  const isSliding = lm.from != null && lm.to != null && lm.removed === null;

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
      {/* Top Player Indicator (Rosso / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#f43f5e"
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Pezzi: ${gameState.piecesOnBoard[1]}`}
      />

      {/* Board */}
      <div
        className={`w-full aspect-square rounded-3xl p-3 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: '#d9a66b' }}
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
              className="text-[#5a3a18]"
              opacity="0.55"
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
                {piece !== null &&
                  (isSliding && lm.to === i ? (
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={3.2}
                      initial={{ cx: slideFromPos![0], cy: slideFromPos![1] }}
                      animate={{ cx: x, cy: y }}
                      transition={SLIDE}
                      fill={piece === 0 ? '#3b82f6' : '#f43f5e'}
                      stroke="#fff"
                      strokeWidth="0.6"
                    />
                  ) : (
                    <circle
                      cx={x}
                      cy={y}
                      r={3.2}
                      fill={piece === 0 ? '#3b82f6' : '#f43f5e'}
                      stroke="#fff"
                      strokeWidth="0.6"
                    />
                  ))}
                {piece === null && (
                  <circle cx={x} cy={y} r={1.6} fill="rgba(0,0,0,0.25)" />
                )}
                {isSelected && <circle cx={x} cy={y} r={4.5} fill="none" stroke="#f59e0b" strokeWidth="1.4" />}
                {isLast && <circle cx={x} cy={y} r={5} fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.7" />}
              </g>
            );
          })}

          {/* Removal ghost: fades the removed piece away */}
          {removedPoint != null && (
            <motion.circle
              key={moveKey}
              cx={POS[removedPoint][0]}
              cy={POS[removedPoint][1]}
              r={3.2}
              fill={removedIsPlayer0 ? '#3b82f6' : '#f43f5e'}
              stroke="#fff"
              strokeWidth="0.6"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={FADE}
              pointerEvents="none"
            />
          )}
        </svg>
      </div>

      {/* Bottom Player Indicator (Blu / P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        isCurrentTurn={gameState.turn === 0 && !gameState.gameOver}
        isFlipped={false}
        score={`Pezzi: ${gameState.piecesOnBoard[0]}`}
      />

      <p className="mt-2 text-xs font-semibold text-center text-stone-500 dark:text-stone-400">{statusText}</p>

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
