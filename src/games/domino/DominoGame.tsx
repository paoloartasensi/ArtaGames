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
import { getTurnColor } from '../../utils/turnColor';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';

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
      className={`${dims} bg-[#f3e3c0] border-2 border-[#c49a5a] shadow-sm flex flex-col overflow-hidden`}
    >
      <div className="flex-1 border-b border-[#c49a5a] flex items-center justify-center">
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

  const canPlayTile = (t: DominoTile) => tileMatches(t, gameState.leftEnd, gameState.rightEnd) !== null;

  const p1Name = 'Blu (Giocatore 1)';
  const p2Name = playMode === 'bot' ? 'Rosso (BOT)' : 'Rosso (Giocatore 2)';

  const p2HasPlayable = hasPlayableTile(gameState.hands[1], gameState.leftEnd, gameState.rightEnd);
  const p1HasPlayable = hasPlayableTile(gameState.hands[0], gameState.leftEnd, gameState.rightEnd);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto px-2">
      {/* Top Player Indicator (Rosso / P2: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#f43f5e"
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Tessere: ${gameState.hands[1].length}`}
      />

      {/* Player 2 Hand (flipped 180 for tabletop local_pvp) */}
      {playMode === 'local_pvp' && (
        <div className="w-full rotate-180 my-1.5 rounded-2xl p-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 transition-transform">
          <div className="flex flex-wrap gap-1.5 justify-center min-h-[56px]">
            {gameState.hands[1].map((t) => {
              const playable = gameState.turn === 1 && canPlayTile(t) && !gameState.gameOver;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTileClick(t.id)}
                  disabled={!playable}
                  className={`transition-transform ${playable ? 'hover:-translate-y-1 cursor-pointer' : 'opacity-80'}`}
                >
                  <div className={playable ? 'ring-2 ring-amber-400 rounded-lg' : ''}>
                    <DominoTileView tile={t} size="sm" />
                  </div>
                </button>
              );
            })}
          </div>
          {gameState.turn === 1 && !gameState.gameOver && !p2HasPlayable && (
            <div className="mt-1 flex justify-center">
              <button
                onClick={handleDraw}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-black text-xs shadow transition-transform active:scale-95"
              >
                {gameState.boneyard.length > 0 ? 'Pesca tessera' : 'Passa'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Board chain */}
      <div
        className={`w-full rounded-3xl p-3 shadow-xl min-h-[110px] transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: gameState.gameOver ? theme.boardBg : getTurnColor(gameState.turn, playMode) }}
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
      <div className="mt-2 w-full rounded-2xl p-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
        <div className="flex flex-wrap gap-2 justify-center min-h-[80px]">
          {gameState.hands[0].length === 0 ? (
            <span className="text-xs text-stone-400 self-center">Nessuna tessera</span>
          ) : (
            gameState.hands[0].map((t) => {
              const playable = gameState.turn === 0 && canPlayTile(t) && !gameState.gameOver && !isBotThinking;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTileClick(t.id)}
                  disabled={!playable}
                  className={`transition-transform ${playable ? 'hover:-translate-y-1 cursor-pointer' : 'opacity-80'}`}
                >
                  <div className={playable ? 'ring-2 ring-amber-400 rounded-lg' : ''}>
                    <DominoTileView tile={t} size="sm" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {gameState.turn === 0 && !gameState.gameOver && !p1HasPlayable && !isBotThinking && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={handleDraw}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-transform active:scale-95"
            >
              {gameState.boneyard.length > 0 ? 'Pesca una tessera' : 'Passa il turno'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Player Indicator (Blu / P1: normal orientation) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        isCurrentTurn={gameState.turn === 0 && !gameState.gameOver}
        isFlipped={false}
        score={`Tessere: ${gameState.hands[0].length}`}
      />

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
