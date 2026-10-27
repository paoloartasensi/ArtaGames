import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './theme/themeContext';
import { Header } from './components/Header';
import { GameSelector } from './components/GameSelector';
import { ThemeModal } from './components/ThemeModal';
import { KidsRulesModal } from './components/KidsRulesModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ExitButton } from './components/ExitButton';
import { GameLaunchModal } from './components/GameLaunchModal';
import { GameId, GAME_REGISTRY } from './games/registry';
import { PlayMode, Difficulty } from './types/game';

// Game Views
import { Connect4Game } from './games/connect4/Connect4Game';
import { CheckersGame } from './games/checkers/CheckersGame';
import { BattleshipGame } from './games/battleship/BattleshipGame';
import { ChessGame } from './games/chess/ChessGame';
import { GoGame } from './games/go/GoGame';
import { TicTacToeGame } from './games/tictactoe/TicTacToeGame';
import { SnakesGame } from './games/snakes/SnakesGame';
import { MemoryGame } from './games/memory/MemoryGame';
import { MancalaGame } from './games/mancala/MancalaGame';
import { DominoGame } from './games/domino/DominoGame';
import { ReversiGame } from './games/reversi/ReversiGame';
import { MorrisGame } from './games/morris/MorrisGame';
import { QuartoGame } from './games/quarto/QuartoGame';
import { LudoGame } from './games/ludo/LudoGame';
import { DotsBoxesGame } from './games/dotsboxes/DotsBoxesGame';
import { GomokuGame } from './games/gomoku/GomokuGame';
import { NimGame } from './games/nim/NimGame';
import { AbaloneGame } from './games/abalone/AbaloneGame';
import { GuessWhoGame } from './games/guesswho/GuessWhoGame';
import { GooseGame } from './games/goose/GooseGame';
import { SimonGame } from './games/simon/SimonGame';

function AppContent() {
  const { theme } = useTheme();

  const [activeGameId, setActiveGameId] = useState<GameId>('connect4');
  const [viewMode, setViewMode] = useState<'catalog' | 'game'>('catalog');
  const [playMode, setPlayMode] = useState<PlayMode>('bot');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isTabletFlipped, setIsTabletFlipped] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [pendingGameId, setPendingGameId] = useState<GameId | null>(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

  const activeGame = GAME_REGISTRY[activeGameId];

  const handleSelectGame = (id: GameId) => {
    setPendingGameId(id);
    setIsLaunchModalOpen(true);
  };

  const handleLaunchGame = (mode: PlayMode, diff: Difficulty) => {
    if (pendingGameId) {
      setActiveGameId(pendingGameId);
    }
    setPlayMode(mode);
    setDifficulty(diff);
    setViewMode('game');
    setIsLaunchModalOpen(false);
    setGameKey((k) => k + 1);
  };

  const renderActiveGameBoard = () => (
    <>
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

              {activeGameId === 'snakes' && (
                <SnakesGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'memory' && (
                <MemoryGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                />
              )}

              {activeGameId === 'mancala' && (
                <MancalaGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'domino' && (
                <DominoGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'reversi' && (
                <ReversiGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'morris' && (
                <MorrisGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'quarto' && (
                <QuartoGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'ludo' && (
                <LudoGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'dotsboxes' && (
                <DotsBoxesGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'gomoku' && (
                <GomokuGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'nim' && (
                <NimGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'abalone' && (
                <AbaloneGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'guesswho' && (
                <GuessWhoGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'goose' && (
                <GooseGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}

              {activeGameId === 'simon' && (
                <SimonGame
                  key={gameKey}
                  playMode={playMode}
                  difficulty={difficulty}
                  onOpenRules={() => setIsRulesModalOpen(true)}
                  onSelectGame={() => setViewMode('catalog')}
                  isTabletFlipped={isTabletFlipped}
                />
              )}
    </>
  );

  if (viewMode === 'game') {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#56a2cb] select-none flex flex-col items-center justify-center z-30">
        {/* Top-Right "USCITA" Tab Button */}
        <ExitButton onExit={() => setViewMode('catalog')} />

        {/* Board Container */}
        <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto py-2 sm:py-3 px-1 sm:px-3">
          {renderActiveGameBoard()}
        </div>

        {/* Rules Modal */}
        <KidsRulesModal
          game={activeGame}
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
        />
      </div>
    );
  }

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
        <GameSelector
          onSelectGame={handleSelectGame}
          activeGameId={activeGameId}
        />
      </main>

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Modals */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      <GameLaunchModal
        gameId={pendingGameId}
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
        onLaunch={handleLaunchGame}
        onOpenRules={() => setIsRulesModalOpen(true)}
      />

      <KidsRulesModal
        game={pendingGameId ? GAME_REGISTRY[pendingGameId] : activeGame}
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
