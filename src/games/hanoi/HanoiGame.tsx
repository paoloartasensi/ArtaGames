import React, { useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { HANOI_DISKS, Towers, createTowers, canMove, moveDisk, isHanoiSolved, minMoves } from './hanoiEngine';
import { PuzzleShell } from '../../components/PuzzleShell';
import { VictoryModal } from '../../components/VictoryModal';
import { useFitSize } from '../../utils/useFitSize';
import { sound } from '../../utils/audio';

interface HanoiGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const DISK_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];

export const HanoiGame: React.FC<HanoiGameProps> = ({ difficulty, onOpenRules, onSelectGame }) => {
  const disks = HANOI_DISKS[difficulty];
  const [towers, setTowers] = useState<Towers>(() => createTowers(disks));
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);

  const width = useFitSize(260, 640);
  const towerW = Math.floor(width / 3);
  const diskH = Math.max(22, Math.min(40, Math.floor((width * 0.7) / (disks + 2))));
  const towerH = diskH * (disks + 2) + 20;
  const won = isHanoiSolved(towers, disks);

  const newGame = () => {
    setTowers(createTowers(disks));
    setSelected(null);
    setMoves(0);
    setWarning(null);
  };

  const tapTower = (t: number) => {
    if (won) return;
    if (selected === null) {
      if (towers[t].length === 0) {
        setWarning('Questa torre è vuota: scegli una torre con dei dischi.');
        return;
      }
      setSelected(t);
      setWarning(null);
      sound.playTick();
      return;
    }
    if (selected === t) {
      setSelected(null);
      return;
    }
    if (!canMove(towers, selected, t)) {
      setWarning('Un disco grande non può stare sopra uno più piccolo!');
      sound.playMiss();
      setSelected(null);
      return;
    }
    const next = moveDisk(towers, selected, t) as Towers;
    setTowers(next);
    setSelected(null);
    setMoves((m) => m + 1);
    setWarning(null);
    if (isHanoiSolved(next, disks)) sound.playWin();
    else sound.playStone();
  };

  const best = minMoves(disks);
  const message = warning
    ? warning
    : won
    ? 'Torre spostata! 🎉'
    : selected !== null
    ? 'Ora tocca la torre dove mettere il disco.'
    : 'Sposta tutta la torre sul paletto a destra ➡️ Un disco alla volta, mai uno grande sopra uno piccolo!';

  return (
    <PuzzleShell
      title="Torre di Hanoi"
      message={message}
      stats={
        <span>
          Mosse: {moves} <span className="opacity-75">(record: {best})</span>
        </span>
      }
      onRestart={newGame}
      onOpenRules={onOpenRules}
    >
      <div className="flex items-end rounded-2xl bg-amber-100 border-2 border-stone-800 shadow-2xl" style={{ padding: '12px 0 0' }}>
        {towers.map((tower, t) => {
          const isSel = selected === t;
          const canDrop = selected !== null && selected !== t && canMove(towers, selected, t);
          return (
            <button
              key={t}
              onClick={() => tapTower(t)}
              className="relative"
              style={{
                width: towerW,
                height: towerH,
                padding: 0,
                background: canDrop ? 'rgba(34,197,94,0.18)' : 'transparent',
                borderRadius: 12,
              }}
              aria-label={`Torre ${t + 1}`}
            >
              {/* Pole */}
              <div
                className="absolute rounded-t-full"
                style={{
                  left: towerW / 2 - 6,
                  width: 12,
                  bottom: 14,
                  height: towerH - 30,
                  background: t === 2 ? '#16a34a' : '#78350f',
                }}
              />
              {/* Base */}
              <div
                className="absolute rounded-full"
                style={{ left: 6, right: 6, bottom: 4, height: 12, background: '#78350f' }}
              />
              {tower.map((size, i) => {
                const lifted = isSel && i === tower.length - 1;
                const w = Math.floor(((towerW - 16) * (size + 1)) / (disks + 1));
                return (
                  <div
                    key={size}
                    className="absolute rounded-full"
                    style={{
                      left: (towerW - w) / 2,
                      width: w,
                      height: diskH - 4,
                      bottom: lifted ? towerH - diskH - 6 : 16 + i * diskH,
                      background: DISK_COLORS[(size - 1) % DISK_COLORS.length],
                      border: '2px solid #1c1917',
                      boxShadow: lifted ? '0 6px 12px rgba(0,0,0,0.35)' : 'inset 0 -4px 0 rgba(0,0,0,0.25)',
                      WebkitTransition: 'bottom 0.15s ease-out',
                      transition: 'bottom 0.15s ease-out',
                    }}
                  />
                );
              })}
            </button>
          );
        })}
      </div>

      <VictoryModal
        isOpen={won}
        winnerTitle="Torre completata! 🗼"
        winnerSubtitle={
          moves === best
            ? `Perfetto! ${moves} mosse: il minimo possibile!`
            : `Ce l'hai fatta in ${moves} mosse. Il minimo è ${best}: riesci a farcela?`
        }
        onRematch={newGame}
        onSelectGame={onSelectGame}
      />
    </PuzzleShell>
  );
};
