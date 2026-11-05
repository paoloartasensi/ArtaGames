import React, { useMemo, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { createSudoku, SudokuPuzzle } from './sudokuEngine';
import { PuzzleShell } from '../../components/PuzzleShell';
import { VictoryModal } from '../../components/VictoryModal';
import { useFitSize } from '../../utils/useFitSize';
import { sound } from '../../utils/audio';

interface SudokuGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

// The 4x4 puzzle uses fruit instead of numbers for the little ones
const FRUITS = ['🍎', '🍌', '🍇', '🍊'];

export const SudokuGame: React.FC<SudokuGameProps> = ({ difficulty, onOpenRules, onSelectGame }) => {
  const [puzzle, setPuzzle] = useState<SudokuPuzzle>(() => createSudoku(difficulty));
  const [grid, setGrid] = useState<number[][]>(() => puzzle.solution.map((row, r) => row.map((v, c) => (puzzle.given[r][c] ? v : 0))));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);

  const { size, boxRows, boxCols } = puzzle.config;
  const boardPx = useFitSize(300, 540);
  const cell = Math.floor(boardPx / size);
  const symbol = (v: number) => (size === 4 ? FRUITS[v - 1] : String(v));

  const solved = useMemo(
    () => grid.every((row, r) => row.every((v, c) => v === puzzle.solution[r][c])),
    [grid, puzzle]
  );

  const newGame = () => {
    const p = createSudoku(difficulty);
    setPuzzle(p);
    setGrid(p.solution.map((row, r) => row.map((v, c) => (p.given[r][c] ? v : 0))));
    setSelected(null);
    setMistakes(0);
    setHints(0);
  };

  const place = (v: number) => {
    if (!selected || solved) return;
    const { r, c } = selected;
    if (puzzle.given[r][c]) return;
    const next = grid.map((row) => [...row]);
    next[r][c] = v;
    setGrid(next);
    if (v !== 0 && v !== puzzle.solution[r][c]) {
      setMistakes((m) => m + 1);
      sound.playMiss();
    } else if (v !== 0) {
      sound.playStone();
      if (next.every((row, rr) => row.every((x, cc) => x === puzzle.solution[rr][cc]))) sound.playWin();
    }
  };

  const hint = () => {
    if (solved) return;
    // Fix the selected cell if it's wrong/empty, otherwise a random empty one
    let target = selected && !puzzle.given[selected.r][selected.c] && grid[selected.r][selected.c] !== puzzle.solution[selected.r][selected.c]
      ? selected
      : null;
    if (!target) {
      const open: { r: number; c: number }[] = [];
      grid.forEach((row, r) => row.forEach((v, c) => v !== puzzle.solution[r][c] && open.push({ r, c })));
      if (open.length === 0) return;
      target = open[Math.floor(Math.random() * open.length)];
    }
    const next = grid.map((row) => [...row]);
    next[target.r][target.c] = puzzle.solution[target.r][target.c];
    setGrid(next);
    setSelected(target);
    setHints((h) => h + 1);
    sound.playTick();
  };

  const selValue = selected ? grid[selected.r][selected.c] : 0;
  const sameBox = (r: number, c: number) =>
    !!selected &&
    Math.floor(r / boxRows) === Math.floor(selected.r / boxRows) &&
    Math.floor(c / boxCols) === Math.floor(selected.c / boxCols);

  const message = solved
    ? 'Fantastico! Sudoku completato! 🎉'
    : selected
    ? puzzle.given[selected.r][selected.c]
      ? 'Questa casella è già scritta: scegline una vuota.'
      : 'Ora tocca un simbolo qui sotto.'
    : size === 4
    ? 'Ogni riga, colonna e quadrato deve avere tutti i 4 frutti!'
    : `Ogni riga, colonna e riquadro deve avere i numeri da 1 a ${size}!`;

  const fontSize = size === 4 ? cell * 0.55 : cell * 0.55;
  const padBtn = Math.min(64, Math.floor((boardPx + 8) / (size + 1)) - 6);

  return (
    <PuzzleShell
      title="Sudoku"
      message={message}
      stats={
        <span>
          ❌ {mistakes} · 💡 {hints}
        </span>
      }
      onRestart={newGame}
      onOpenRules={onOpenRules}
    >
      <div
        className="bg-stone-800 rounded-xl shadow-2xl"
        style={{ padding: 4, width: cell * size + 8 }}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((v, c) => {
              const isSel = selected?.r === r && selected?.c === c;
              const related = !!selected && (selected.r === r || selected.c === c || sameBox(r, c));
              const sameValue = selValue !== 0 && v === selValue;
              const wrong = v !== 0 && v !== puzzle.solution[r][c];
              const given = puzzle.given[r][c];
              const bg = isSel
                ? '#fde68a'
                : sameValue
                ? '#bae6fd'
                : related
                ? '#f1f5f9'
                : '#ffffff';
              return (
                <button
                  key={c}
                  onClick={() => setSelected({ r, c })}
                  className="flex items-center justify-center font-black"
                  style={{
                    width: cell,
                    height: cell,
                    background: bg,
                    color: wrong ? '#dc2626' : given ? '#1c1917' : '#2563eb',
                    fontSize,
                    lineHeight: 1,
                    borderRight: (c + 1) % boxCols === 0 && c !== size - 1 ? '3px solid #292524' : '1px solid #a8a29e',
                    borderBottom: (r + 1) % boxRows === 0 && r !== size - 1 ? '3px solid #292524' : '1px solid #a8a29e',
                    borderTop: 'none',
                    borderLeft: 'none',
                    padding: 0,
                  }}
                >
                  {v !== 0 ? symbol(v) : ''}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Symbol pad */}
      <div className="flex flex-wrap justify-center mt-3" style={{ maxWidth: boardPx + 40 }}>
        {Array.from({ length: size }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            onClick={() => place(v)}
            className="m-1 rounded-2xl bg-white border-2 border-stone-800 shadow-md font-black text-stone-800 active:scale-95 flex items-center justify-center"
            style={{ width: padBtn, height: padBtn, fontSize: padBtn * 0.5 }}
          >
            {symbol(v)}
          </button>
        ))}
        <button
          onClick={() => place(0)}
          className="m-1 rounded-2xl bg-stone-200 border-2 border-stone-800 shadow-md font-black text-stone-700 active:scale-95 flex items-center justify-center"
          style={{ width: padBtn, height: padBtn, fontSize: padBtn * 0.4 }}
          aria-label="Cancella"
        >
          ⌫
        </button>
        <button
          onClick={hint}
          className="m-1 rounded-2xl bg-yellow-300 border-2 border-stone-800 shadow-md font-black active:scale-95 flex items-center justify-center"
          style={{ width: padBtn, height: padBtn, fontSize: padBtn * 0.45 }}
          aria-label="Aiuto"
        >
          💡
        </button>
      </div>

      <VictoryModal
        isOpen={solved}
        winnerTitle="Sudoku risolto! 🧠"
        winnerSubtitle={
          mistakes === 0 && hints === 0
            ? 'Perfetto: nessun errore e nessun aiuto!'
            : `Errori: ${mistakes} · Aiuti usati: ${hints}`
        }
        onRematch={newGame}
        onSelectGame={onSelectGame}
      />
    </PuzzleShell>
  );
};
