import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import {
  BattleshipState,
  createInitialBattleshipState,
  fireShotAtEnemy,
  fireBotShot,
  generateRandomFleet,
  FLEET_CONFIG,
  CellState,
} from './battleshipEngine';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { Shuffle, Crosshair, Shield } from 'lucide-react';

interface BattleshipGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
}

export const BattleshipGame: React.FC<BattleshipGameProps> = ({
  playMode,
  difficulty,
  onSelectGame,
}) => {
  const { theme, isDark } = useTheme();
  const [gameState, setGameState] = useState<BattleshipState>(createInitialBattleshipState(8));
  const [activeTab, setActiveTab] = useState<'radar' | 'fleet'>('radar');
  const [isBotThinking, setIsBotThinking] = useState(false);

  // BOT firing turn
  useEffect(() => {
    if (gameState.phase === 'battle' && gameState.turn === 'enemy' && !gameState.winner && !isBotThinking) {
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
  }, [gameState, difficulty, isBotThinking]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState.phase !== 'battle' || gameState.turn !== 'player' || isBotThinking) return;

    const res = fireShotAtEnemy(gameState, r, c);
    if (!res) return;

    if (res.result === 'hit' || res.result === 'sunk') {
      sound.playHit();
    } else {
      sound.playMiss();
    }

    setGameState(res.nextState);
  };

  const handleRandomizeFleet = () => {
    sound.playTick();
    const newFleet = generateRandomFleet(gameState.gridSize, FLEET_CONFIG);
    const newBoard: CellState[][] = Array(gameState.gridSize)
      .fill(null)
      .map(() => Array(gameState.gridSize).fill('empty' as CellState));

    newFleet.forEach((ship) => {
      for (let i = 0; i < ship.size; i++) {
        const r = ship.horizontal ? ship.r : ship.r + i;
        const c = ship.horizontal ? ship.c + i : ship.c;
        newBoard[r][c] = 'ship';
      }
    });

    setGameState({
      ...gameState,
      playerShips: newFleet,
      playerBoard: newBoard,
    });
  };

  const handleRestart = () => {
    setGameState(createInitialBattleshipState(8));
    setActiveTab('radar');
  };

  const playerShipsLeft = gameState.playerShips.filter((s) => !s.sunk).length;
  const enemyShipsLeft = gameState.enemyShips.filter((s) => !s.sunk).length;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-2">
      {/* Fleet health counters */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 ring-1 ring-blue-500/30">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold">Tua Flotta: {playerShipsLeft}/5</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 ring-1 ring-red-500/30">
          <Crosshair className="w-4 h-4 text-red-400" />
          <span className="text-xs font-semibold">Nemici Rimanenti: {enemyShipsLeft}/5</span>
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
          <span>Radar Nemico (Attacca)</span>
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
          <span>Le Tue Navi ({playerShipsLeft}/5)</span>
        </button>
      </div>

      {/* Grids Display (Side by side on tablet/desktop, Tabbed on small phone) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {/* Radar Nemico */}
        <div
          className={`flex-col items-center ${activeTab === 'radar' ? 'flex' : 'hidden sm:flex'}`}
        >
          <div className="text-xs font-bold mb-2 flex items-center gap-1.5 text-red-400">
            <Crosshair className="w-3.5 h-3.5" />
            <span>RADAR NEMICO (Tocca per Sparare)</span>
          </div>

          <div
            className="game-board-container relative w-full aspect-square p-2 rounded-2xl shadow-lg border border-slate-700"
            style={{ backgroundColor: '#0c1a2c' }}
          >
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full gap-1">
              {gameState.enemyBoard.map((row, r) =>
                row.map((cell, c) => (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={
                      gameState.turn !== 'player' ||
                      cell === 'hit' ||
                      cell === 'miss' ||
                      gameState.phase === 'game_over' ||
                      isBotThinking
                    }
                    className={`rounded-lg flex items-center justify-center transition-all ${
                      cell === 'hit'
                        ? 'bg-red-600 shadow-inner ring-1 ring-red-400 animate-pulse'
                        : cell === 'miss'
                        ? 'bg-cyan-950/70 border border-cyan-800'
                        : 'bg-slate-900/80 hover:bg-slate-800 active:scale-95 border border-slate-800'
                    }`}
                  >
                    {cell === 'hit' && <span className="text-sm">🔥</span>}
                    {cell === 'miss' && <span className="text-xs text-cyan-400">💧</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* La Tua Flotta */}
        <div
          className={`flex-col items-center ${activeTab === 'fleet' ? 'flex' : 'hidden sm:flex'}`}
        >
          <div className="text-xs font-bold mb-2 flex items-center justify-between w-full text-blue-400 px-1">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>LA TUA FLOTTA</span>
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
              {gameState.playerBoard.map((row, r) =>
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
                ))
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

      {/* Victory modal */}
      <VictoryModal
        isOpen={gameState.phase === 'game_over'}
        winnerTitle={gameState.winner === 'player' ? 'Vittoria Navale! ⚓🏆' : 'Flotta Affondata!'}
        winnerSubtitle={
          gameState.winner === 'player'
            ? 'Bravissimo capitano! Hai trovato e affondato tutte le 5 navi nemiche!'
            : 'L\'avversario ha trovato tutte le tue navi. Pronto a riorganizzare la flotta?'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
