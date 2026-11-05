import React, { useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { PUZZLE15_SIZES, shuffledTiles, slideTiles, isSolved } from './puzzle15Engine';
import { PuzzleShell } from '../../components/PuzzleShell';
import { VictoryModal } from '../../components/VictoryModal';
import { useFitSize } from '../../utils/useFitSize';
import { sound } from '../../utils/audio';

interface Puzzle15GameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const TILE_COLORS = ['#f97316', '#0ea5e9', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

export const Puzzle15Game: React.FC<Puzzle15GameProps> = ({ difficulty, onOpenRules, onSelectGame }) => {
  const n = PUZZLE15_SIZES[difficulty];
  const [tiles, setTiles] = useState<number[]>(() => shuffledTiles(n));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const boardPx = useFitSize(250, 520);
  const gap = 6;
  const tile = Math.floor((boardPx - gap * (n + 1)) / n);
  const inner = tile * n + gap * (n + 1);

  const newGame = () => {
    setTiles(shuffledTiles(n));
    setMoves(0);
    setWon(false);
  };

  const tap = (idx: number) => {
    if (won) return;
    if (showGoal) {
      setShowGoal(false);
      return;
    }
    const res = slideTiles(tiles, n, idx);
    if (res.moved === 0) {
      sound.playMiss();
      return;
    }
    sound.playStone();
    setTiles(res.tiles);
    setMoves((m) => m + 1);
    if (isSolved(res.tiles)) {
      setWon(true);
      sound.playWin();
    }
  };

  // Render tiles by value so they slide (CSS transition on left/top) when they move
  const positions: { value: number; idx: number }[] = [];
  tiles.forEach((value, idx) => value !== 0 && positions.push({ value, idx }));
  positions.sort((a, b) => a.value - b.value);

  return (
    <PuzzleShell
      title="Gioco del 15"
      message={won ? 'Ce l\'hai fatta! Tutti in ordine! 🎉' : `Tocca un numero vicino al buco per farlo scorrere. Metti in ordine da 1 a ${n * n - 1}!`}
      stats={<span>Mosse: {moves}</span>}
      onRestart={newGame}
      onOpenRules={onOpenRules}
      extraButtons={
        <button
          onClick={() => setShowGoal((s) => !s)}
          className="m-1 h-12 px-4 rounded-2xl bg-white text-stone-800 font-black border-2 border-stone-800 shadow-md active:scale-95"
        >
          {showGoal ? 'Nascondi' : '👀 Soluzione'}
        </button>
      }
    >
      <div
        className="relative rounded-2xl bg-stone-800 shadow-2xl"
        style={{ width: inner, height: inner }}
      >
        {positions.map(({ value, idx }) => {
          const r = Math.floor(idx / n);
          const c = idx % n;
          const home = value - 1 === idx;
          const target = showGoal ? value - 1 : idx;
          const tr = Math.floor(target / n);
          const tc = target % n;
          return (
            <button
              key={value}
              onClick={() => tap(idx)}
              className="absolute rounded-xl border-2 border-stone-900 font-black text-white flex items-center justify-center active:brightness-110"
              style={{
                width: tile,
                height: tile,
                left: gap + (showGoal ? tc : c) * (tile + gap),
                top: gap + (showGoal ? tr : r) * (tile + gap),
                background: TILE_COLORS[Math.floor((value - 1) / n) % TILE_COLORS.length],
                fontSize: tile * 0.42,
                boxShadow: home ? 'inset 0 -5px 0 rgba(0,0,0,0.25), 0 0 0 3px #fde047' : 'inset 0 -5px 0 rgba(0,0,0,0.25)',
                WebkitTransition: 'left 0.15s ease-out, top 0.15s ease-out',
                transition: 'left 0.15s ease-out, top 0.15s ease-out',
                padding: 0,
                textShadow: '0 2px 0 rgba(0,0,0,0.3)',
              }}
            >
              {value}
            </button>
          );
        })}
      </div>

      <VictoryModal
        isOpen={won}
        winnerTitle="Puzzle risolto! 🧩"
        winnerSubtitle={`Ci sei riuscito in ${moves} mosse!`}
        onRematch={newGame}
        onSelectGame={onSelectGame}
      />
    </PuzzleShell>
  );
};
