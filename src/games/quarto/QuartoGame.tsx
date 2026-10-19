import React, { useEffect, useState } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  QuartoState,
  QuartoPiece,
  createInitialQuartoState,
  pickQuarto,
  placeQuarto,
  getBotQuartoPick,
  getBotQuartoPlace,
} from './quartoEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';

interface QuartoGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

function pieceStyle(p: QuartoPiece): React.CSSProperties {
  const color = p.dark ? '#1f2937' : '#f8fafc';
  const border = p.dark ? '#e5e7eb' : '#94a3b8';
  return {
    width: p.tall ? '86%' : '58%',
    height: p.tall ? '86%' : '58%',
    background: p.hollow ? 'transparent' : color,
    border: `${p.hollow ? 4 : 3}px solid ${border}`,
    borderRadius: p.round ? '50%' : '24%',
    boxShadow: p.hollow ? 'none' : 'inset 0 2px 3px rgba(0,0,0,0.25)',
  };
}

function PieceView({ piece, size = 48 }: { piece: QuartoPiece; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5"
      style={{ width: size, height: size }}
    >
      <div style={pieceStyle(piece)} />
    </div>
  );
}

export const QuartoGame: React.FC<QuartoGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<QuartoState>(createInitialQuartoState());
  const [isBotThinking, setIsBotThinking] = useState(false);

  useEffect(() => {
    if (playMode !== 'bot' || gameState.gameOver) return;
    const botPicks = gameState.turn === 1 && gameState.phase === 'pick';
    const botPlaces = gameState.turn === 0 && gameState.phase === 'place';
    if (!botPicks && !botPlaces) return;

    setIsBotThinking(true);
    const t = setTimeout(() => {
      if (botPicks) {
        const pieceId = getBotQuartoPick(gameState, difficulty);
        const next = pickQuarto(gameState, pieceId);
        if (next) {
          sound.playTick();
          setGameState(next);
        }
      } else {
        const cell = getBotQuartoPlace(gameState, difficulty);
        const next = placeQuarto(gameState, cell.r, cell.c);
        if (next) {
          sound.playStone();
          setGameState(next);
        }
      }
      setIsBotThinking(false);
    }, 650);
    return () => clearTimeout(t);
  }, [gameState, playMode, difficulty]);

  const humanPicks =
    playMode === 'bot' ? gameState.turn === 0 && gameState.phase === 'pick' : gameState.phase === 'pick';
  const humanPlaces =
    playMode === 'bot' ? gameState.turn === 1 && gameState.phase === 'place' : gameState.phase === 'place';

  const handlePickPiece = (pieceId: number) => {
    if (gameState.gameOver || isBotThinking || !humanPicks) return;
    const next = pickQuarto(gameState, pieceId);
    if (next) {
      sound.playTick();
      setGameState(next);
    }
  };

  const handlePlaceCell = (r: number, c: number) => {
    if (gameState.gameOver || isBotThinking || !humanPlaces) return;
    const next = placeQuarto(gameState, r, c);
    if (next) {
      sound.playStone();
      setGameState(next);
    }
  };

  const handleRestart = () => setGameState(createInitialQuartoState());

  const isWinningCell = (r: number, c: number) =>
    gameState.winningLine?.some((p) => p.r === r && p.c === c) ?? false;

  const statusText =
    playMode === 'bot'
      ? gameState.turn === 0 && gameState.phase === 'pick'
        ? 'Scegli un pezzo da dare al BOT'
        : gameState.turn === 1 && gameState.phase === 'place'
        ? 'Piazza il pezzo che il BOT ti ha dato'
        : gameState.turn === 1 && gameState.phase === 'pick'
        ? 'Il BOT sta scegliendo un pezzo per te...'
        : 'Il BOT sta piazzando il pezzo...'
      : gameState.phase === 'pick'
      ? `Giocatore ${gameState.turn === 0 ? '1' : '2'}: scegli un pezzo per l'avversario`
      : `Giocatore ${gameState.turn === 0 ? '2' : '1'}: piazza il pezzo scelto`;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-2">
      <p className="mb-3 text-xs font-semibold text-center text-stone-500 dark:text-stone-400">{statusText}</p>

      {/* Board */}
      <div
        className={`w-full aspect-square rounded-3xl p-2 sm:p-3 shadow-xl transition-transform ${isTabletFlipped ? 'rotate-180' : ''}`}
        style={{ backgroundColor: '#6b4423' }}
      >
        <div className="grid grid-cols-4 gap-1.5 h-full w-full bg-black/20 rounded-xl p-1.5">
          {gameState.board.map((row, r) =>
            row.map((cell, c) => {
              const placeable = humanPlaces && cell === null && !gameState.gameOver && !isBotThinking;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handlePlaceCell(r, c)}
                  disabled={!placeable}
                  className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${
                    placeable ? 'bg-white/20 hover:bg-white/30 cursor-pointer' : 'bg-black/10 dark:bg-white/5'
                  } ${isWinningCell(r, c) ? 'ring-4 ring-amber-400' : ''}`}
                >
                  {cell && <div style={pieceStyle(cell)} />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Current piece to place */}
      {gameState.phase === 'place' && gameState.currentPick && (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
          <span>Pezzo da piazzare:</span>
          <PieceView piece={gameState.currentPick} size={36} />
        </div>
      )}

      {/* Available pieces tray */}
      <div className="mt-3 w-full rounded-2xl p-3 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
        <div className="text-[11px] font-bold mb-2 text-stone-500 dark:text-stone-400">
          {humanPicks ? 'Pezzi disponibili (tocca per scegliere)' : 'Pezzi rimasti'}
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center min-h-[52px]">
          {gameState.available.length === 0 ? (
            <span className="text-xs text-stone-400 self-center">Nessun pezzo rimasto</span>
          ) : (
            gameState.available.map((p) => {
              const pickable = humanPicks && !gameState.gameOver && !isBotThinking;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePickPiece(p.id)}
                  disabled={!pickable}
                  className={`transition-transform ${pickable ? 'hover:-translate-y-1 cursor-pointer' : ''}`}
                >
                  <div className={pickable ? 'ring-2 ring-amber-400 rounded-xl' : ''}>
                    <PieceView piece={p} size={44} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {isBotThinking && (
        <div className="mt-2 text-xs font-medium text-amber-500 animate-pulse">Il BOT sta pensando...</div>
      )}

      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'draw'
            ? 'Pareggio Amichevole!'
            : gameState.winner === 0
            ? 'Vince il Giocatore 1! 🎉'
            : 'Vince il Giocatore 2! 🎉'
        }
        winnerSubtitle={
          gameState.winner === 'draw'
            ? 'Tavolo pieno senza fila: che sfida!'
            : gameState.winner === 0
            ? playMode === 'bot'
              ? 'Quarto! Hai fatto la fila vincente!'
              : 'Quarto! Complimenti al Giocatore 1!'
            : playMode === 'bot'
            ? 'Il BOT ha fatto Quarto. Rivincita?'
            : 'Quarto! Complimenti al Giocatore 2!'
        }
        isDraw={gameState.winner === 'draw'}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
