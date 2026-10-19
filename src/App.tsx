import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './theme/themeContext';
import { Header } from './components/Header';
import { GameSelector } from './components/GameSelector';
import { GameControls } from './components/GameControls';
import { ThemeModal } from './components/ThemeModal';
import { KidsRulesModal } from './components/KidsRulesModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GameId, GAME_REGISTRY } from './games/registry';
import { PlayMode, Difficulty } from './types/game';

// Game Views
import { Connect4Game } from './games/connect4/Connect4Game';
import { CheckersGame } from './games/checkers/CheckersGame';
import { BattleshipGame } from './games/battleship/BattleshipGame';
import { ChessGame } from './games/chess/ChessGame';
import { GoGame } from './games/go/GoGame';
import { TicTacToeGame } from './games/tictactoe/TicTacToeGame';

import { ArrowLeft, Sparkles } from 'lucide-react';

function AppContent() {
  const { theme, isDark } = useTheme();

  const [activeGameId, setActiveGameId] = useState<GameId>('connect4');
  const [viewMode, setViewMode] = useState<'catalog' | 'game'>('game');
  const [playMode, setPlayMode] = useState<PlayMode>('bot');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isTabletFlipped, setIsTabletFlipped] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const activeGame = GAME_REGISTRY[activeGameId];

  const handleSelectGame = (id: GameId) => {
    setActiveGameId(id);
    setViewMode('game');
    setGameKey((k) => k + 1);
  };

  const handleRestart = () => {
    setGameKey((k) => k + 1);
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme.bgMain} ${theme.textPrimary}`}>
      {/* Top Bar Header */}
      <Header
        activeGameId={activeGameId}
        viewMode={viewMode}
        onGoToCatalog={() => setViewMode('catalog')}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenTheme={() => setIsThemeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 flex flex-col justify-start">
        {viewMode === 'catalog' ? (
          <GameSelector
            onSelectGame={handleSelectGame}
            activeGameId={activeGameId}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Active Game Title Bar */}
            <div className="w-full flex items-center justify-between gap-3 pb-2 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('catalog')}
                  className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    isDark
                      ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                      : 'border-black/10 text-stone-700 hover:text-black hover:bg-black/5'
                  }`}
                  title="Torna a tutti i giochi"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Catalogo</span>
                </button>

                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight">
                    {activeGame.title}
                  </h2>
                  <div className={`text-xs flex items-center gap-1.5 ${theme.textMuted}`}>
                    <span>{activeGame.minAge}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeGame.category}</span>
                  </div>
                </div>
              </div>

              {/* Rules link button */}
              <button
                onClick={() => setIsRulesModalOpen(true)}
                className={`text-xs font-semibold text-amber-500 hover:text-amber-400 underline underline-offset-2 flex items-center gap-1`}
              >
                <span>Regole 3 Passi</span>
              </button>
            </div>

            {/* Central Game Controls (Mode, Difficulty, Restart, Flip) */}
            <GameControls
              playMode={playMode}
              onSetPlayMode={setPlayMode}
              difficulty={difficulty}
              onSetDifficulty={setDifficulty}
              onRestart={handleRestart}
              onOpenRules={() => setIsRulesModalOpen(true)}
              isTabletFlipped={isTabletFlipped}
              onToggleTabletFlip={() => setIsTabletFlipped(!isTabletFlipped)}
            />

            {/* Active Game Board */}
            <div className="w-full py-2 flex justify-center">
              {activeGameId === 'connect4' && (
                <Connect4Game
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'checkers' && (
                <CheckersGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'battleship' && (
                <BattleshipGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                />
              )}

              {activeGameId === 'chess' && (
                <ChessGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'go' && (
                <GoGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'tictactoe' && (
                <TicTacToeGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Modals */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      <KidsRulesModal
        game={activeGame}
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
