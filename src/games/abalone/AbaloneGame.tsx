import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  AbaloneState,
  createInitialAbaloneState,
  getAllAbaCells,
  abaKey,
  extendAbaSelection,
  tryAbaMove,
  applyAbaMove,
  getBotAbaMove,
} from './abaloneEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface AbaloneGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const S = 44; // spacing between cell centres
const R = 19; // marble radius
const P_COLORS = ['#1f2937', '#f8fafc']; // black, white marbles

export const AbaloneGame: React.FC<AbaloneGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<AbaloneState>(createInitialAbaloneState());
  const [selected, setSelected] = useState<string[]>([]);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT turn
  useEffect(() => {
    if (playMode !== 'bot' || gameState.gameOver || isBotThinking) return;
    if (gameState.turn !== 1) return;
    setIsBotThinking(true);
    const t = setTimeout(() => {
      const move = getBotAbaMove(gameState, difficulty);
      if (move) {
        const next = applyAbaMove(gameState, move);
        if (next) {
          if (move.knockedOff.length > 0) sound.playCapture();
          else sound.playMove();
          setGameState(next);
        }
      }
      setIsBotThinking(false);
    }, 700);
    return () => clearTimeout(t);
  }, [gameState, playMode, difficulty, isBotThinking]);

  const canAct = !gameState.gameOver && !isBotThinking && (playMode !== 'bot' || gameState.turn === 0);

  const handleCellClick = (key: string) => {
    if (!canAct) return;
    const val = gameState.board[key];
    if (val === gameState.turn) {
      // Select / extend our own group.
      const next = extendAbaSelection(gameState, selected, key);
      setSelected(next ?? [key]);
      sound.playTick();
    } else {
      // Empty or opponent cell -> try to move/push.
      const next = tryAbaMove(gameState, selected, key);
      if (next) {
        if (next.lastMove && next.lastMove.knockedOff.length > 0) sound.playCapture();
        else sound.playMove();
        setGameState(next);
        setSelected([]);
      }
    }
  };

  const handleRestart = () => {
    setGameState(createInitialAbaloneState());
    setSelected([]);
  };

  // Pixel coords (pointy-top axial layout, horizontal rows).
  const px = (q: number, r: number) => S * Math.sqrt(3) * (q + r / 2);
  const py = (q: number, r: number) => S * 1.5 * r;

  const cells = getAllAbaCells();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of cells) {
    const x = px(c.q, c.r);
    const y = py(c.q, c.r);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const pad = R + 10;
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;

  const humanOut = gameState.knockedOut[0];
  const botOut = gameState.knockedOut[1];

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-2">
      {/* Turn / status bar */}
      <div className="flex items-center justify-between w-full mb-3 px-1 gap-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all flex-1 ${
            gameState.turn === 0 && !gameState.gameOver ? 'ring-2 ring-stone-400 bg-white/10' : 'opacity-70'
          }`}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-stone-800 ring-1 ring-white/40 shrink-0" />
          <span className="text-xs font-semibold">{playMode === 'bot' ? 'Tu' : 'Giocatore 1'}</span>
          <span className="ml-auto text-[10px] font-bold opacity-70">fuori {humanOut}/6</span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all flex-1 ${
            gameState.turn === 1 && !gameState.gameOver ? 'ring-2 ring-slate-200 bg-white/10' : 'opacity-70'
          }`}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-white ring-1 ring-black/40 shrink-0" />
          <span className="text-xs font-semibold">{playMode === 'bot' ? 'BOT' : 'Giocatore 2'}</span>
          <span className="ml-auto text-[10px] font-bold opacity-70">fuori {botOut}/6</span>
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold text-center text-stone-500 dark:text-stone-400">
        {gameState.gameOver
          ? 'Partita finita!'
          : selected.length === 0
          ? 'Tocca una delle tue biglie per sceglierla'
          : selected.length === 1
          ? 'Ora tocca una biglia vicina (fila) o una casella vuota'
          : 'Tocca la casella in fondo alla fila per spingere o muovere'}
      </p>

      {/* Board */}
      <div
        className={`w-full rounded-3xl p-2 sm:p-3 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: theme.boardBg }}
      >
        <svg viewBox={viewBox} className="w-full h-auto block select-none">
          {cells.map((c) => {
            const key = abaKey(c.q, c.r);
            const owner = gameState.board[key];
            const x = px(c.q, c.r);
            const y = py(c.q, c.r);
            const isSelected = selected.includes(key);

            if (owner === undefined) {
              return (
                <g key={key} onClick={() => handleCellClick(key)} className={canAct ? 'cursor-pointer' : ''}>
                  <circle cx={x} cy={y} r={R * 0.5} fill="none" stroke={theme.boardGrid} strokeWidth={1} opacity={0.28} />
                  <circle cx={x} cy={y} r={R + 4} fill="transparent" />
                </g>
              );
            }

            return (
              <g key={key} onClick={() => handleCellClick(key)} className={canAct ? 'cursor-pointer' : ''}>
                {isSelected && <circle cx={x} cy={y} r={R + 5} fill="none" stroke="#f59e0b" strokeWidth={3} />}
                <circle
                  cx={x}
                  cy={y}
                  r={R}
                  fill={P_COLORS[owner]}
                  stroke={owner === 0 ? '#0f172a' : '#cbd5e1'}
                  strokeWidth={2}
                />
                <circle cx={x - 6} cy={y - 7} r={R * 0.32} fill="#ffffff" opacity={owner === 0 ? 0.25 : 0.6} />
              </g>
            );
          })}
        </svg>
      </div>

      {isBotThinking && (
        <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse">Il BOT sta pensando...</div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 0
            ? playMode === 'bot'
              ? 'Hai vinto! 🏆'
              : 'Vince il Giocatore 1! 🏆'
            : playMode === 'bot'
            ? 'Vince il BOT! 🏆'
            : 'Vince il Giocatore 2! 🏆'
        }
        winnerSubtitle="Sei biglie nemiche buttate fuori dal bordo!"
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
