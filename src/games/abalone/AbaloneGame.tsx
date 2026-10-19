import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  AbaloneState,
  createInitialAbaloneState,
  getAllAbaCells,
  abaKey,
  parseAbaKey,
  extendAbaSelection,
  tryAbaMove,
  applyAbaMove,
  getBotAbaMove,
} from './abaloneEngine';
import { useTheme } from '../../theme/themeContext';
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
import { motion } from 'motion/react';
import { SLIDE, FADE, useMoveKey } from '../../utils/animations';

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

// Given a marble's current cell `key`, returns the cell it slid from in `lm` (or null).
function abaSlideSource(key: string, lm: AbaloneState['lastMove']): string | null {
  if (!lm || lm.from.length === 0) return null;
  const i = lm.to.indexOf(key);
  if (i >= 0) return lm.from[i]; // part of the moving group

  const a = parseAbaKey(lm.from[0]);
  const b = parseAbaKey(lm.to[0]);
  const dq = b.q - a.q;
  const dr = b.r - a.r;
  const front = parseAbaKey(lm.from[lm.from.length - 1]);
  const k = parseAbaKey(key);
  // Pushed opponents land at front + d*j (j >= 2); they came from front + d*(j-1).
  for (let j = 2; j <= 4; j++) {
    if (k.q === front.q + dq * j && k.r === front.r + dr * j) {
      return abaKey(front.q + dq * (j - 1), front.r + dr * (j - 1));
    }
  }
  return null;
}

export const AbaloneGame: React.FC<AbaloneGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [target, setTarget] = useState<number>(6);
  const [gameState, setGameState] = useState<AbaloneState>(() => createInitialAbaloneState(6));
  const [selected, setSelected] = useState<string[]>([]);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT turn
  useEffect(() => {
    if (playMode !== 'bot' || gameState.gameOver) return;
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
  }, [gameState, playMode, difficulty]);

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

  const handleRestart = (newTarget?: number) => {
    const t = newTarget ?? target;
    if (newTarget) setTarget(newTarget);
    setGameState(createInitialAbaloneState(t));
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
  const moveKey = useMoveKey(gameState.lastMove);

  const p1Name = playMode === 'bot' ? 'Tu (Nero)' : 'Nero (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'BOT (Bianco)' : 'Bianco (Giocatore 2)';

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-2">
      {/* Top Player Indicator (Bianco / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#ffffff"
        pieceIcon={<div className="w-2.5 h-2.5 rounded-full bg-white ring-1 ring-black/40" />}
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Fuori: ${botOut}/${gameState.target}`}
      />

      {/* Win threshold toggle */}
      <div className="flex items-center justify-center w-full my-1.5 px-1 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10">
          {[4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => handleRestart(n)}
              className={`px-2.5 py-1 rounded-lg font-black transition-colors ${
                target === n ? 'bg-amber-500 text-stone-900 shadow-sm' : 'text-stone-600 dark:text-stone-300 hover:text-white'
              }`}
            >
              a {n}
            </button>
          ))}
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
        style={{ backgroundColor: '#20242e' }}
      >
        <svg viewBox={viewBox} className="w-full h-auto block select-none">
          {cells.map((c) => {
            const key = abaKey(c.q, c.r);
            const owner = gameState.board[key];
            const x = px(c.q, c.r);
            const y = py(c.q, c.r);
            const isSelected = selected.includes(key);
            const srcKey = abaSlideSource(key, gameState.lastMove);
            const src = srcKey ? parseAbaKey(srcKey) : null;

            if (owner === undefined) {
              return (
                <g key={key} onClick={() => handleCellClick(key)} className={canAct ? 'cursor-pointer' : ''}>
                  <circle cx={x} cy={y} r={R * 0.5} fill="none" stroke={theme.boardGrid} strokeWidth={1} opacity={0.28} />
                  <circle cx={x} cy={y} r={R + 4} fill="transparent" />
                </g>
              );
            }

            const marble = (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={R}
                  fill={P_COLORS[owner]}
                  stroke={owner === 0 ? '#e5e7eb' : '#475569'}
                  strokeWidth={2}
                />
                <circle cx={x - 6} cy={y - 7} r={R * 0.32} fill="#ffffff" opacity={owner === 0 ? 0.3 : 0.65} />
              </>
            );

            return (
              <g key={key} onClick={() => handleCellClick(key)} className={canAct ? 'cursor-pointer' : ''}>
                {isSelected && <circle cx={x} cy={y} r={R + 5} fill="none" stroke="#f59e0b" strokeWidth={3} />}
                {src ? (
                  <motion.g
                    initial={{ x: px(src.q, src.r) - x, y: py(src.q, src.r) - y }}
                    animate={{ x: 0, y: 0 }}
                    transition={SLIDE}
                  >
                    {marble}
                  </motion.g>
                ) : (
                  marble
                )}
              </g>
            );
          })}

          {/* Knocked-off ghost: fades the marble that fell off the board */}
          {gameState.lastMove?.knockedOff?.length ? (
            (() => {
              const ko = parseAbaKey(gameState.lastMove.knockedOff[0]);
              return (
                <motion.circle
                  key={moveKey}
                  cx={px(ko.q, ko.r)}
                  cy={py(ko.q, ko.r)}
                  r={R}
                  fill={P_COLORS[gameState.turn]}
                  stroke={gameState.turn === 0 ? '#e5e7eb' : '#475569'}
                  strokeWidth={2}
                  initial={{ opacity: 0.9, scale: 1 }}
                  animate={{ opacity: 0, scale: 0.5 }}
                  transition={FADE}
                  pointerEvents="none"
                />
              );
            })()
          ) : null}
        </svg>
      </div>

      {/* Bottom Player Indicator (Nero / P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#1f2937"
        pieceIcon={<div className="w-2.5 h-2.5 rounded-full bg-stone-900 ring-1 ring-white/40" />}
        isCurrentTurn={gameState.turn === 0 && !gameState.gameOver}
        isFlipped={false}
        score={`Fuori: ${humanOut}/${gameState.target}`}
      />

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
        winnerSubtitle={`Hai buttato fuori ${gameState.target} biglie nemiche!`}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
