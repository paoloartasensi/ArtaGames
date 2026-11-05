import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { MASTERMIND_CONFIGS, PEG_COLORS, createSecret, scoreGuess } from './mastermindEngine';
import { PuzzleShell } from '../../components/PuzzleShell';
import { VictoryModal } from '../../components/VictoryModal';
import { sound } from '../../utils/audio';

interface MastermindGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

interface PastGuess {
  pegs: number[];
  exact: number;
  near: number;
}

function usePegSize(tries: number): number {
  const compute = () => {
    const availH = window.innerHeight - 330;
    const availW = window.innerWidth - 40;
    return Math.max(22, Math.min(46, Math.floor(availH / tries) - 8, Math.floor(availW / 7)));
  };
  const [size, setSize] = useState(compute);
  useEffect(() => {
    const onResize = () => setSize(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tries]);
  return size;
}

const Peg: React.FC<{ color: number | null; size: number; onClick?: () => void; highlight?: boolean }> = ({
  color,
  size,
  onClick,
  highlight,
}) => {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: size / 2,
    margin: 3,
    background: color === null ? 'rgba(0,0,0,0.25)' : PEG_COLORS[color].hex,
    border: highlight ? '3px solid #fde047' : '2px solid #1c1917',
    boxShadow: color === null ? 'inset 0 2px 4px rgba(0,0,0,0.4)' : 'inset 0 -4px 0 rgba(0,0,0,0.25)',
    padding: 0,
    flexShrink: 0,
  };
  return onClick ? <button onClick={onClick} style={style} /> : <div style={style} />;
};

export const MastermindGame: React.FC<MastermindGameProps> = ({ difficulty, onOpenRules, onSelectGame }) => {
  const cfg = MASTERMIND_CONFIGS[difficulty];
  const [secret, setSecret] = useState<number[]>(() => createSecret(cfg));
  const [history, setHistory] = useState<PastGuess[]>([]);
  const [current, setCurrent] = useState<(number | null)[]>(() => Array(cfg.length).fill(null));
  const [warning, setWarning] = useState<string | null>(null);
  const peg = usePegSize(cfg.tries);

  const won = history.length > 0 && history[history.length - 1].exact === cfg.length;
  const lost = !won && history.length >= cfg.tries;
  const over = won || lost;

  const newGame = () => {
    setSecret(createSecret(cfg));
    setHistory([]);
    setCurrent(Array(cfg.length).fill(null));
    setWarning(null);
  };

  const addColor = (color: number) => {
    if (over) return;
    const slot = current.indexOf(null);
    if (slot === -1) return;
    if (!cfg.repeats && current.includes(color)) {
      setWarning('In questo livello ogni colore compare una volta sola!');
      return;
    }
    const next = [...current];
    next[slot] = color;
    setCurrent(next);
    setWarning(null);
    sound.playTick();
  };

  const clearSlot = (i: number) => {
    if (over) return;
    const next = [...current];
    next[i] = null;
    setCurrent(next);
  };

  const submit = () => {
    if (over || current.includes(null)) return;
    const pegs = current as number[];
    const { exact, near } = scoreGuess(pegs, secret);
    const nextHistory = [...history, { pegs, exact, near }];
    setHistory(nextHistory);
    setCurrent(Array(cfg.length).fill(null));
    if (exact === cfg.length) sound.playWin();
    else if (nextHistory.length >= cfg.tries) sound.playMiss();
    else sound.playStone();
  };

  const rowsLeft = cfg.tries - history.length;
  const message = warning
    ? warning
    : over
    ? won
      ? 'Codice scoperto! 🎉'
      : 'Tentativi finiti!'
    : (
      <span>
        Indovina i {cfg.length} colori segreti! <span style={{ color: '#16a34a' }}>●</span> = colore e posto giusti,{' '}
        <span style={{ color: '#ca8a04' }}>●</span> = colore giusto, posto sbagliato.
      </span>
    );

  const feedbackDots = (g: PastGuess) => {
    const dots: string[] = [];
    for (let i = 0; i < g.exact; i++) dots.push('#16a34a');
    for (let i = 0; i < g.near; i++) dots.push('#facc15');
    while (dots.length < cfg.length) dots.push('rgba(0,0,0,0.2)');
    const d = Math.max(8, Math.floor(peg / 2.6));
    return (
      <div className="flex flex-wrap items-center" style={{ width: (d + 4) * 2 + 2, marginLeft: 8 }}>
        {dots.map((c, i) => (
          <div key={i} style={{ width: d, height: d, borderRadius: d / 2, background: c, margin: 2, border: '1px solid #1c1917' }} />
        ))}
      </div>
    );
  };

  return (
    <PuzzleShell
      title="Mastermind"
      message={message}
      stats={<span>Tentativi: {rowsLeft}</span>}
      onRestart={newGame}
      onOpenRules={onOpenRules}
    >
      <div className="rounded-2xl bg-amber-900 border-2 border-stone-900 shadow-2xl px-3 py-2">
        {/* Secret row */}
        <div className="flex items-center justify-center pb-1 mb-1" style={{ borderBottom: '2px solid rgba(0,0,0,0.3)' }}>
          {secret.map((c, i) =>
            over ? (
              <Peg key={i} color={c} size={peg} />
            ) : (
              <div
                key={i}
                className="flex items-center justify-center font-black text-white"
                style={{ width: peg, height: peg, margin: 3, borderRadius: peg / 2, background: '#44403c', border: '2px solid #1c1917', fontSize: peg * 0.5 }}
              >
                ?
              </div>
            )
          )}
          <div style={{ width: (Math.max(8, Math.floor(peg / 2.6)) + 4) * 2 + 10 }} />
        </div>

        {history.map((g, r) => (
          <div key={r} className="flex items-center justify-center">
            {g.pegs.map((c, i) => (
              <Peg key={i} color={c} size={peg} />
            ))}
            {feedbackDots(g)}
          </div>
        ))}

        {!over && (
          <div className="flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
            {current.map((c, i) => (
              <Peg key={i} color={c} size={peg} highlight={c === null && current.indexOf(null) === i} onClick={() => clearSlot(i)} />
            ))}
            <button
              onClick={submit}
              disabled={current.includes(null)}
              className="font-black rounded-xl border-2 border-stone-900 active:scale-95"
              style={{
                marginLeft: 8,
                height: peg,
                padding: '0 10px',
                background: current.includes(null) ? '#a8a29e' : '#22c55e',
                color: '#fff',
                fontSize: Math.max(13, peg * 0.38),
              }}
            >
              Prova!
            </button>
          </div>
        )}

        {Array.from({ length: Math.max(0, rowsLeft - 1) }).map((_, r) => (
          <div key={`e${r}`} className="flex items-center justify-center" style={{ opacity: 0.35 }}>
            {Array.from({ length: cfg.length }).map((__, i) => (
              <Peg key={i} color={null} size={peg} />
            ))}
            <div style={{ width: (Math.max(8, Math.floor(peg / 2.6)) + 4) * 2 + 10 }} />
          </div>
        ))}
      </div>

      {/* Palette */}
      <div className="flex flex-wrap justify-center mt-2">
        {PEG_COLORS.slice(0, cfg.colors).map((c, i) => (
          <button
            key={c.name}
            onClick={() => addColor(i)}
            aria-label={c.name}
            className="m-1 active:scale-90"
            style={{
              width: Math.max(44, peg + 10),
              height: Math.max(44, peg + 10),
              borderRadius: Math.max(44, peg + 10) / 2,
              background: c.hex,
              border: '3px solid #1c1917',
              boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.25)',
              opacity: !cfg.repeats && current.includes(i) ? 0.35 : 1,
              padding: 0,
            }}
          />
        ))}
      </div>

      <VictoryModal
        isOpen={over}
        isDraw={lost}
        winnerTitle={won ? 'Codice scoperto! 🕵️' : 'Peccato!'}
        winnerSubtitle={
          won
            ? `Ce l'hai fatta in ${history.length} ${history.length === 1 ? 'tentativo' : 'tentativi'}!`
            : `Il codice era: ${secret.map((c) => PEG_COLORS[c].name).join(', ')}. Riprova!`
        }
        onRematch={newGame}
        onSelectGame={onSelectGame}
      />
    </PuzzleShell>
  );
};
