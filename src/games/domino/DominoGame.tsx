import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  DominoState,
  DominoTile,
  createInitialDominoState,
  playDomino,
  drawDomino,
  hasPlayableTile,
  tileMatches,
  getBotDominoAction,
} from './dominoEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface DominoGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

const PIPS: Record<number, [number, number][]> = {
  0: [],
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function HalfPips({ value }: { value: number }) {
  return (
    <div className="relative w-full h-full">
      {PIPS[value].map(([cx, cy], i) => (
        <span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-stone-900"
          style={{ left: `${cx * 50}%`, top: `${cy * 50}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
    </div>
  );
}

function DominoTileView({
  tile,
  flip = false,
  size = 'md',
}: {
  tile: DominoTile;
  flip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const top = flip ? tile.b : tile.a;
  const bottom = flip ? tile.a : tile.b;
  const dims =
    size === 'sm'
      ? 'w-8 h-14 rounded-md'
      : size === 'lg'
      ? 'w-14 h-24 rounded-lg'
      : 'w-10 h-[72px] rounded-lg';
  return (
    <div
      className={`${dims} bg-white border-2 border-stone-300 shadow-sm flex flex-col overflow-hidden`}
    >
      <div className="flex-1 border-b border-stone-400 flex items-center justify-center">
        <HalfPips value={top} />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <HalfPips value={bottom} />
      </div>
    </div>
  );
}

export const DominoGame: React.FC<DominoGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<DominoState>(createInitialDominoState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  useEffect(() => {
    if (playMode === 'bot' && gameState.turn === 1 && !gameState.gameOver) {
      setIsBotThinking(true);
      const t = setTimeout(() => {
        const action = getBotDominoAction(gameState, difficulty);
        if (action.type === 'draw') {
          const next = drawDomino(gameState);
          if (next) {
            sound.playTick();
            setGameState(next);
          }
        } else {
          const next = playDomino(gameState, action.tileId, action.side);
          if (next) {
            sound.playStone();
            setGameState(next);
          }
        }
        setIsBotThinking(false);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [gameState, playMode, difficulty]);

  const handleTileClick = (tileId: number) => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    const next = playDomino(gameState, tileId);
    if (next) {
      sound.playStone();
      setGameState(next);
    }
  };

  const handleDraw = () => {
    if (gameState.gameOver || isBotThinking) return;
    if (playMode === 'bot' && gameState.turn === 1) return;
    const next = drawDomino(gameState);
    if (next) {
      sound.playTick();
      setGameState(next);
    }
  };

  const handleRestart = () => setGameState(createInitialDominoState());

  const isMyTurn = playMode === 'bot' ? gameState.turn === 0 : true;
  const hand = gameState.hands[gameState.turn];
  const canPlayTile = (t: DominoTile) => tileMatches(t, gameState.leftEnd, gameState.rightEnd) !== null;
  const hasPlayable = hasPlayableTile(hand, gameState.leftEnd, gameState.rightEnd);

  const p1Name = 'Blu (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Rosso (BOT)' : 'Rosso (Giocatore 2)';

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-2">
      {/* Turn indicator */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 0 && !gameState.gameOver ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'opacity-70'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-xs font-semibold">{p1Name}</span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
            gameState.turn === 1 && !gameState.gameOver ? 'ring-2 ring-rose-500 bg-rose-500/10' : 'opacity-70'
          }`}
        >
          <span className="text-xs font-semibold">{p2Name}</span>
          <div className="w-4 h-4 rounded-full bg-rose-500 shadow-sm" />
        </div>
      </div>

      {/* Board chain */}
      <div
        className={`w-full rounded-3xl p-3 shadow-xl min-h-[110px] transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: theme.boardBg }}
      >
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {gameState.board.map(({ tile, flip }, i) => (
            <DominoTileView key={i} tile={tile} flip={flip} size="sm" />
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-stone-500 dark:text-stone-400">
        <span>Aperture: {gameState.leftEnd} · {gameState.rightEnd}</span>
        <span>Pesca: {gameState.boneyard.length} tessere</span>
      </div>

      {/* Hand */}
      <div className="mt-3 w-full rounded-2xl p-3 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
        <div className="text-[11px] font-bold mb-2 text-stone-500 dark:text-stone-400">
          {isMyTurn ? 'Le tue tessere (tocca per giocare)' : 'Tessere avversario'}
        </div>
        <div className="flex flex-wrap gap-2 justify-center min-h-[96px]">
          {hand.length === 0 ? (
            <span className="text-xs text-stone-400 self-center">Nessuna tessera</span>
          ) : (
            hand.map((t) => {
              const playable = isMyTurn && canPlayTile(t) && !gameState.gameOver && !isBotThinking;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTileClick(t.id)}
                  disabled={!playable}
                  className={`transition-transform ${playable ? 'hover:-translate-y-1 cursor-pointer' : 'opacity-80'}`}
                >
                  <div className={playable ? 'ring-2 ring-amber-400 rounded-lg' : ''}>
                    <DominoTileView tile={t} size="lg" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {isMyTurn && !gameState.gameOver && !hasPlayable && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={handleDraw}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow transition-transform active:scale-95"
            >
              {gameState.boneyard.length > 0 ? 'Pesca una tessera' : 'Passa il turno'}
            </button>
          </div>
        )}
      </div>

      {isBotThinking && (
        <div className="mt-2 text-xs font-medium text-amber-500 animate-pulse">Il BOT sta giocando...</div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Pareggio Amichevole!'
            : gameState.winner === 0
            ? 'Vince il Blu! 🎉'
            : 'Vince il Rosso! 🎉'
        }
        winnerSubtitle={
          gameState.winner === 'draw'
            ? 'Stesso punteggio: partita bloccata!'
            : gameState.winner === 0
            ? playMode === 'bot'
              ? 'Hai finito tutte le tue tessere!'
              : 'Complimenti al Giocatore 1!'
            : playMode === 'bot'
            ? 'Il BOT ha finito le tessere. Rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        isDraw={gameState.winner === 'draw'}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
