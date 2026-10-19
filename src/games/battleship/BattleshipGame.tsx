import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  BattleshipState,
  Side,
  createInitialBattleshipState,
  fireShot,
  fireBotShot,
  randomizeFleet,
} from './battleshipEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { Shuffle, Crosshair, Shield, Check } from 'lucide-react';

interface BattleshipGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
}

interface Handoff {
  title: string;
  subtitle: string;
}

const sideName = (side: Side): string => (side === 'p1' ? 'Giocatore 1' : 'Giocatore 2');

export const BattleshipGame: React.FC<BattleshipGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
}) => {
  const { isDark } = useTheme();
  const isPvP = playMode === 'local_pvp';

  const [gameState, setGameState] = useState<BattleshipState>(() =>
    createInitialBattleshipState(8, isPvP ? 'placement' : 'battle'),
  );
  const [activeTab, setActiveTab] = useState<'radar' | 'fleet'>('radar');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [handoff, setHandoff] = useState<Handoff | null>(null);

  // Reset the game cleanly when switching between BOT and 1vs1
  useEffect(() => {
    setGameState(createInitialBattleshipState(8, isPvP ? 'placement' : 'battle'));
    setActiveTab('radar');
    setIsBotThinking(false);
    setHandoff(null);
  }, [isPvP]);

  // In PvP, whose turn it is also determines whose board is shown.
  const viewer: Side = isPvP ? gameState.turn : 'p1';
  const opponent: Side = viewer === 'p1' ? 'p2' : 'p1';
  const ownBoard = viewer === 'p1' ? gameState.p1Board : gameState.p2Board;
  const oppBoard = viewer === 'p1' ? gameState.p2Board : gameState.p1Board;

  const p1ShipsLeft = gameState.p1Ships.filter((s) => !s.sunk).length;
  const p2ShipsLeft = gameState.p2Ships.filter((s) => !s.sunk).length;

  // BOT firing turn (only in BOT mode; the bot is always p2)
  useEffect(() => {
    if (isPvP) return;
    if (gameState.phase === 'battle' && gameState.turn === 'p2' && !gameState.winner && !isBotThinking) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const { nextState, result } = fireBotShot(gameState, difficulty);
        if (result === 'hit' || result === 'sunk') {
          sound.playHit();
        } else {
          sound.playMiss();
        }
        setGameState(nextState);
        setIsBotThinking(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [gameState, difficulty, isBotThinking, isPvP]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState.phase !== 'battle' || isBotThinking || handoff) return;
    if (gameState.turn !== viewer) return;

    const res = fireShot(gameState, viewer, r, c);
    if (!res) return;

    if (res.result === 'hit' || res.result === 'sunk') {
      sound.playHit();
    } else {
      sound.playMiss();
    }

    setGameState(res.nextState);

    if (isPvP && res.nextState.phase !== 'game_over') {
      const next = res.nextState.turn;
      setHandoff({
        title: `Passa il dispositivo a ${sideName(next)}`,
        subtitle: 'Non guardare! Tocca per iniziare il tuo turno.',
      });
    }
  };

  const handleRandomizeFleet = () => {
    sound.playTick();
    // In PvP placement the shuffle targets whoever is placing; in BOT battle it's the human (p1).
    setGameState(randomizeFleet(gameState, viewer));
  };

  const handleReady = () => {
    sound.playTick();
    if (gameState.turn === 'p1') {
      setGameState({ ...gameState, turn: 'p2', lastMessage: 'Giocatore 2: disponi le tue navi, poi premi Pronto!' });
      setHandoff({
        title: 'Passa il dispositivo a Giocatore 2',
        subtitle: 'Giocatore 1 ha finito. Giocatore 2, prepara le tue navi!',
      });
    } else {
      setGameState({
        ...gameState,
        turn: 'p1',
        phase: 'battle',
        lastMessage: 'Tocca una casella sulla griglia radar per sparare!',
      });
      setHandoff({
        title: 'Passa il dispositivo a Giocatore 1',
        subtitle: 'Tocca per iniziare il tuo turno!',
      });
    }
  };

  const handleDismissHandoff = () => {
    sound.playTick();
    setHandoff(null);
  };

  const handleRestart = () => {
    setGameState(createInitialBattleshipState(8, isPvP ? 'placement' : 'battle'));
    setActiveTab('radar');
    setHandoff(null);
    setIsBotThinking(false);
  };

  const winnerTitle = gameState.winner
    ? isPvP
      ? `${sideName(gameState.winner)} vince! ⚓🏆`
      : gameState.winner === 'p1'
      ? 'Vittoria Navale! ⚓🏆'
      : 'Flotta Affondata!'
    : '';

  const winnerSubtitle = gameState.winner
    ? isPvP
      ? `${sideName(gameState.winner)} ha affondato tutta la flotta avversaria!`
      : gameState.winner === 'p1'
      ? 'Bravissimo capitano! Hai trovato e affondato tutte le 5 navi nemiche!'
      : "L'avversario ha trovato tutte le tue navi. Pronto a riorganizzare la flotta?"
    : '';

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-2">
      {isPvP && gameState.phase === 'placement' ? (
        /* ===== PLACEMENT VIEW (1vs1) ===== */
        <div className="w-full flex-col items-center">
          <div className="flex items-center justify-between w-full mb-3 px-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 ring-1 ring-blue-500/30">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold">
                {sideName(viewer)} — disponi le tue navi
              </span>
            </div>
          </div>

          <div className="w-full flex-col items-center">
            <div className="text-xs font-bold mb-2 flex items-center justify-between w-full text-blue-400 px-1">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>LA FLOTTA DI {sideName(viewer).toUpperCase()}</span>
              </div>
              <button
                onClick={handleRandomizeFleet}
                className="text-[11px] underline flex items-center gap-1 hover:text-white"
              >
                <Shuffle className="w-3 h-3" />
                <span>Disponi Navi</span>
              </button>
            </div>

            <div
              className="game-board-container relative w-full aspect-square p-2 rounded-2xl shadow-lg border border-slate-700"
              style={{ backgroundColor: '#091e3a' }}
            >
              <div className="grid grid-cols-8 grid-rows-8 w-full h-full gap-1">
                {ownBoard.map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`rounded-lg flex items-center justify-center transition-colors ${
                        cell === 'ship'
                          ? 'bg-blue-600/90 border border-blue-400'
                          : 'bg-slate-900/60 border border-slate-800/60'
                      }`}
                    >
                      {cell === 'ship' && <span className="text-xs">⚓</span>}
                    </div>
                  )),
                )}
              </div>
            </div>

            <button
              onClick={handleReady}
              className="w-full mt-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Pronto!</span>
            </button>
          </div>
        </div>
      ) : (
        /* ===== BATTLE VIEW ===== */
        <>
          {/* Fleet health counters */}
          <div className="flex items-center justify-between w-full mb-3 px-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 ring-1 ring-blue-500/30">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold">
                {isPvP ? `Flotta G1: ${p1ShipsLeft}/5` : `Tua Flotta: ${p1ShipsLeft}/5`}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 ring-1 ring-red-500/30">
              <Crosshair className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold">
                {isPvP ? `Flotta G2: ${p2ShipsLeft}/5` : `Nemici Rimanenti: ${p2ShipsLeft}/5`}
              </span>
            </div>
          </div>

          {/* Dynamic status message */}
          <div
            className={`w-full text-center py-2 px-4 rounded-xl mb-3 text-xs font-semibold border ${
              gameState.lastMessage.includes('COLPITO') || gameState.lastMessage.includes('BOOM')
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : isDark
                ? 'bg-white/5 border-white/10 text-slate-300'
                : 'bg-black/5 border-black/10 text-stone-700'
            }`}
          >
            {gameState.lastMessage}
          </div>

          {/* Mobile view toggle tabs */}
          <div className="flex sm:hidden items-center gap-2 mb-3 w-full">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                activeTab === 'radar'
                  ? 'bg-red-600 text-white border-red-500 shadow-sm'
                  : 'border-white/10 text-slate-400'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Radar (Attacca)</span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                activeTab === 'fleet'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'border-white/10 text-slate-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Le Tue Navi ({isPvP ? (viewer === 'p1' ? p1ShipsLeft : p2ShipsLeft) : p1ShipsLeft}/5)</span>
            </button>
          </div>

          {/* Grids Display (Side by side on tablet/desktop, Tabbed on small phone) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Radar (opponent) */}
            <div className={`flex-col items-center ${activeTab === 'radar' ? 'flex' : 'hidden sm:flex'}`}>
              <div className="text-xs font-bold mb-2 flex items-center gap-1.5 text-red-400">
                <Crosshair className="w-3.5 h-3.5" />
                <span>
                  {isPvP ? `RADAR DI ${sideName(viewer).toUpperCase()}` : 'RADAR NEMICO'} (Tocca per Sparare)
                </span>
              </div>

              <div
                className="game-board-container relative w-full aspect-square p-2 rounded-2xl shadow-lg border border-slate-700"
                style={{ backgroundColor: '#0c1a2c' }}
              >
                <div className="grid grid-cols-8 grid-rows-8 w-full h-full gap-1">
                  {oppBoard.map((row, r) =>
                    row.map((cell, c) => {
                      const radarCell = cell === 'ship' ? 'empty' : cell;
                      const canShoot =
                        !isBotThinking &&
                        !handoff &&
                        gameState.phase === 'battle' &&
                        gameState.turn === viewer &&
                        radarCell !== 'hit' &&
                        radarCell !== 'miss';
                      return (
                        <button
                          key={`${r}-${c}`}
                          onClick={() => handleCellClick(r, c)}
                          disabled={!canShoot}
                          className={`rounded-lg flex items-center justify-center transition-all ${
                            radarCell === 'hit'
                              ? 'bg-red-600 shadow-inner ring-1 ring-red-400 animate-pulse'
                              : radarCell === 'miss'
                              ? 'bg-cyan-950/70 border border-cyan-800'
                              : 'bg-slate-900/80 hover:bg-slate-800 active:scale-95 border border-slate-800'
                          }`}
                        >
                          {radarCell === 'hit' && <span className="text-sm">🔥</span>}
                          {radarCell === 'miss' && <span className="text-xs text-cyan-400">💧</span>}
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>
            </div>

            {/* Own fleet */}
            <div className={`flex-col items-center ${activeTab === 'fleet' ? 'flex' : 'hidden sm:flex'}`}>
              <div className="text-xs font-bold mb-2 flex items-center justify-between w-full text-blue-400 px-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isPvP ? `FLOTTA DI ${sideName(viewer).toUpperCase()}` : 'LA TUA FLOTTA'}</span>
                </div>
                {!isPvP && (
                  <button
                    onClick={handleRandomizeFleet}
                    className="text-[11px] underline flex items-center gap-1 hover:text-white"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Disponi Navi</span>
                  </button>
                )}
              </div>

              <div
                className="game-board-container relative w-full aspect-square p-2 rounded-2xl shadow-lg border border-slate-700"
                style={{ backgroundColor: '#091e3a' }}
              >
                <div className="grid grid-cols-8 grid-rows-8 w-full h-full gap-1">
                  {ownBoard.map((row, r) =>
                    row.map((cell, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`rounded-lg flex items-center justify-center transition-colors ${
                          cell === 'hit'
                            ? 'bg-red-600 shadow-inner'
                            : cell === 'miss'
                            ? 'bg-cyan-950/60 border border-cyan-800'
                            : cell === 'ship'
                            ? 'bg-blue-600/90 border border-blue-400'
                            : 'bg-slate-900/60 border border-slate-800/60'
                        }`}
                      >
                        {cell === 'hit' && <span className="text-sm">💥</span>}
                        {cell === 'miss' && <span className="text-xs text-cyan-400">💧</span>}
                        {cell === 'ship' && <span className="text-xs">⚓</span>}
                      </div>
                    )),
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bot Thinking */}
          {isBotThinking && (
            <div className="mt-3 text-xs font-medium text-amber-500 animate-pulse flex items-center gap-1.5">
              <span>L'avversario sta prendendo la mira...</span>
            </div>
          )}
        </>
      )}

      {/* Handoff overlay (pass-the-device) */}
      {handoff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/98 px-6">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/40 flex items-center justify-center mb-5">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{handoff.title}</h2>
            <p className="text-sm text-slate-300 mb-8">{handoff.subtitle}</p>
            <button
              onClick={handleDismissHandoff}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-transform active:scale-95 shadow-sm"
            >
              Tocca per continuare
            </button>
          </div>
        </div>
      )}

      {/* Victory modal */}
      <VictoryModal
        isOpen={gameState.phase === 'game_over'}
        winnerTitle={winnerTitle}
        winnerSubtitle={winnerSubtitle}
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
