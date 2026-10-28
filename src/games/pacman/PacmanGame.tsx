import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import {
  PacmanState,
  Direction,
  createInitialPacmanState,
  canMove,
  getNextCoord,
  MAZE_ROWS,
  MAZE_COLS,
} from './pacmanEngine';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Play,
  Pause,
  Heart,
  Trophy,
} from 'lucide-react';

interface PacmanGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const PacmanGame: React.FC<PacmanGameProps> = ({
  onSelectGame,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<PacmanState>(createInitialPacmanState);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const loopRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(Date.now());
  const mouthToggleRef = useRef(true);

  // Speed: calibrated for 5-year-old child friendliness (approx 220ms per step)
  const stepInterval = 220;

  // Change Pac-Man direction
  const setDirection = useCallback((newDir: Direction) => {
    setGameState((prev) => {
      if (prev.gameOver || prev.gameWon || prev.isPaused) return prev;
      // If can immediately move in this direction, change dir and nextDir
      if (canMove(prev.maze, prev.pacman.x, prev.pacman.y, newDir)) {
        sound.playTick();
        return {
          ...prev,
          pacman: { ...prev.pacman, dir: newDir, nextDir: newDir },
        };
      }
      return {
        ...prev,
        pacman: { ...prev.pacman, nextDir: newDir },
      };
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setDirection('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setDirection('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setDirection('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setDirection('RIGHT');
      } else if (e.key === 'p' || e.key === 'P') {
        setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDirection]);

  // Main game tick loop
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const current = stateRef.current;

      if (!current.gameOver && !current.gameWon && !current.isPaused) {
        if (now - lastStepTimeRef.current >= stepInterval) {
          lastStepTimeRef.current = now;
          mouthToggleRef.current = !mouthToggleRef.current;

          // 1. Move Pac-Man
          let pacDir = current.pacman.dir;
          // Check if queued direction can now be taken (turning into corridor)
          if (
            current.pacman.nextDir !== pacDir &&
            canMove(current.maze, current.pacman.x, current.pacman.y, current.pacman.nextDir)
          ) {
            pacDir = current.pacman.nextDir;
          }

          let newPacX = current.pacman.x;
          let newPacY = current.pacman.y;
          if (canMove(current.maze, current.pacman.x, current.pacman.y, pacDir)) {
            const next = getNextCoord(newPacX, newPacY, pacDir);
            newPacX = next.nextX;
            newPacY = next.nextY;
          }

          // 2. Check dot / pellet eating at new position
          const newMaze = current.maze.map((row) => [...row]);
          let newScore = current.score;
          let newDotsRemaining = current.dotsRemaining;
          let newScaredTimer = Math.max(0, current.scaredTimer - 1);

          const cell = newMaze[newPacY][newPacX];
          if (cell === 2) {
            // Normal dot
            newMaze[newPacY][newPacX] = 0;
            newScore += 10;
            newDotsRemaining -= 1;
            sound.playTick();
          } else if (cell === 3) {
            // Power pellet
            newMaze[newPacY][newPacX] = 0;
            newScore += 50;
            newDotsRemaining -= 1;
            newScaredTimer = 35; // ~7-8 seconds of scared ghosts
            sound.playCapture();
          } else if (cell === 4) {
            // Cherry bonus
            newMaze[newPacY][newPacX] = 0;
            newScore += 100;
            sound.playWin();
          }

          // Check Win!
          if (newDotsRemaining <= 0) {
            sound.playWin();
            setGameState((prev) => ({
              ...prev,
              maze: newMaze,
              score: newScore,
              gameWon: true,
            }));
            return;
          }

          // 3. Move Ghosts
          const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
          const newGhosts = current.ghosts.map((ghost) => {
            // Filter valid directions
            const validDirs = directions.filter((d) => canMove(newMaze, ghost.x, ghost.y, d));

            // Don't turn 180 degrees unless blocked
            const opposite: Record<Direction, Direction> = {
              UP: 'DOWN',
              DOWN: 'UP',
              LEFT: 'RIGHT',
              RIGHT: 'LEFT',
            };
            const preferredDirs = validDirs.filter((d) => d !== opposite[ghost.dir]);
            const choices = preferredDirs.length > 0 ? preferredDirs : validDirs;

            let chosenDir = ghost.dir;
            if (choices.length > 0) {
              // 70% random, 30% targeted towards Pacman
              if (Math.random() < 0.35 && !ghost.isScared && !ghost.isEaten) {
                // target pacman
                choices.sort((a, b) => {
                  const coordA = getNextCoord(ghost.x, ghost.y, a);
                  const coordB = getNextCoord(ghost.x, ghost.y, b);
                  const distA = Math.hypot(coordA.nextX - newPacX, coordA.nextY - newPacY);
                  const distB = Math.hypot(coordB.nextX - newPacX, coordB.nextY - newPacY);
                  return distA - distB;
                });
                chosenDir = choices[0];
              } else {
                chosenDir = choices[Math.floor(Math.random() * choices.length)];
              }
            }

            const nextG = getNextCoord(ghost.x, ghost.y, chosenDir);
            return {
              ...ghost,
              x: nextG.nextX,
              y: nextG.nextY,
              dir: chosenDir,
              isScared: newScaredTimer > 0,
            };
          });

          // 4. Check collision between Pac-Man and ghosts
          let newLives = current.lives;
          let isDead = false;

          for (let i = 0; i < newGhosts.length; i++) {
            const g = newGhosts[i];
            if (g.x === newPacX && g.y === newPacY) {
              if (g.isScared) {
                // Eat ghost!
                sound.playCapture();
                newScore += 200;
                newGhosts[i] = {
                  ...g,
                  x: 9,
                  y: 9,
                  isScared: false,
                  isEaten: true,
                };
              } else {
                // Pacman hit!
                sound.playMiss();
                newLives -= 1;
                isDead = true;
                break;
              }
            }
          }

          if (isDead) {
            if (newLives <= 0) {
              setGameState((prev) => ({
                ...prev,
                lives: 0,
                gameOver: true,
              }));
              return;
            } else {
              // Reset positions
              setGameState((prev) => ({
                ...prev,
                lives: newLives,
                pacman: { ...prev.pacman, x: 9, y: 14, dir: 'LEFT', nextDir: 'LEFT' },
                ghosts: [
                  { id: 'blinky', name: 'Blinky', color: '#ef4444', x: 9, y: 8, dir: 'UP', isScared: false, isEaten: false },
                  { id: 'pinky', name: 'Pinky', color: '#f472b6', x: 8, y: 9, dir: 'UP', isScared: false, isEaten: false },
                  { id: 'inky', name: 'Inky', color: '#38bdf8', x: 10, y: 9, dir: 'UP', isScared: false, isEaten: false },
                  { id: 'clyde', name: 'Clyde', color: '#fb923c', x: 9, y: 10, dir: 'UP', isScared: false, isEaten: false },
                ],
              }));
              return;
            }
          }

          // Normal state update
          setGameState((prev) => ({
            ...prev,
            maze: newMaze,
            pacman: {
              ...prev.pacman,
              x: newPacX,
              y: newPacY,
              dir: pacDir,
              mouthOpen: mouthToggleRef.current,
            },
            ghosts: newGhosts,
            score: newScore,
            dotsRemaining: newDotsRemaining,
            scaredTimer: newScaredTimer,
          }));
        }
      }

      loopRef.current = requestAnimationFrame(tick);
    };

    loopRef.current = requestAnimationFrame(tick);
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, []);

  const handleRestart = () => {
    sound.playTick();
    setGameState(createInitialPacmanState());
    lastStepTimeRef.current = Date.now();
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-5xl md:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 flex-1 h-full min-h-0 select-none">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-black/40 border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-spin">🟡</span>
          <span className="text-base sm:text-lg font-black text-amber-400 tracking-wider">
            PAC-MAN
          </span>
        </div>

        {/* Lives & Score */}
        <div className="flex items-center gap-4">
          {/* Lives */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  i < gameState.lives ? 'text-rose-500 fill-rose-500' : 'text-stone-700'
                }`}
              />
            ))}
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold text-white">
            <span className="text-stone-400">Punti:</span>
            <span className="text-amber-400 font-black text-sm">{gameState.score}</span>
          </div>

          {/* Remaining dots */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-bold text-white">
            <span className="text-stone-400">Pallini:</span>
            <span className="text-cyan-400 font-black">{gameState.dotsRemaining}</span>
          </div>
        </div>

        {/* Pause & Restart */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-sm"
            title={gameState.isPaused ? 'Riprendi' : 'Pausa'}
          >
            {gameState.isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-sm"
            title="Ricomincia"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Maze Arena */}
      <div className="w-full flex-1 flex items-center justify-center my-auto min-h-0 py-2">
        <div
          className="relative aspect-[19/20] h-full max-h-[66vh] rounded-3xl p-2.5 sm:p-3 shadow-2xl border-4 border-blue-600/80 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#000000' }}
        >
          {/* Maze Grid */}
          <div
            className="grid w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${MAZE_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${MAZE_ROWS}, minmax(0, 1fr))`,
            }}
          >
            {gameState.maze.map((row, r) =>
              row.map((cell, c) => {
                const isPacman = gameState.pacman.x === c && gameState.pacman.y === r;
                const ghost = gameState.ghosts.find((g) => g.x === c && g.y === r);

                return (
                  <div
                    key={`${r}-${c}`}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    {/* Maze Wall */}
                    {cell === 1 && (
                      <div className="w-full h-full bg-blue-700/60 rounded-[3px] border border-blue-500/80 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                    )}

                    {/* Small Dot */}
                    {cell === 2 && !isPacman && !ghost && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-200/90 shadow-sm" />
                    )}

                    {/* Power Pellet */}
                    {cell === 3 && !isPacman && !ghost && (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    )}

                    {/* Cherry Bonus */}
                    {cell === 4 && !isPacman && !ghost && (
                      <span className="text-xs sm:text-sm">🍒</span>
                    )}

                    {/* Pacman */}
                    {isPacman && (
                      <div
                        className={`w-[85%] h-[85%] rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)] transition-transform flex items-center justify-center font-black text-xs sm:text-base leading-none select-none ${
                          gameState.pacman.dir === 'UP'
                            ? '-rotate-90'
                            : gameState.pacman.dir === 'DOWN'
                            ? 'rotate-90'
                            : gameState.pacman.dir === 'LEFT'
                            ? 'scale-x-[-1]'
                            : ''
                        }`}
                      >
                        {gameState.pacman.mouthOpen ? '🟡' : '●'}
                      </div>
                    )}

                    {/* Ghost */}
                    {ghost && !isPacman && (
                      <div
                        className={`w-[85%] h-[85%] rounded-t-full flex items-center justify-center text-xs sm:text-base transition-transform select-none ${
                          ghost.isScared ? 'animate-pulse' : ''
                        }`}
                        style={{
                          backgroundColor: ghost.isScared ? '#2563eb' : ghost.color,
                        }}
                      >
                        {ghost.isScared ? '😱' : '👀'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Touch D-Pad for Tablet & iPad */}
      <div className="w-full max-w-xs sm:max-w-sm mx-auto flex flex-col items-center gap-1.5 py-1 px-3">
        <button
          onClick={() => setDirection('UP')}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white flex items-center justify-center shadow-lg border border-white/10"
          title="Su"
        >
          <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={() => setDirection('LEFT')}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white flex items-center justify-center shadow-lg border border-white/10"
            title="Sinistra"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <button
            onClick={() => setDirection('DOWN')}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white flex items-center justify-center shadow-lg border border-white/10"
            title="Giù"
          >
            <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <button
            onClick={() => setDirection('RIGHT')}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white flex items-center justify-center shadow-lg border border-white/10"
            title="Destra"
          >
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      <VictoryModal
        isOpen={gameState.gameOver || gameState.gameWon}
        winnerTitle={
          gameState.gameWon ? 'VITTORIA! Labirinto Completato! 🟡🎉' : 'Game Over! 👻'
        }
        winnerSubtitle={
          gameState.gameWon
            ? `Bravissimo! Hai mangiato tutti i pallini totalizzando ${gameState.score} punti! Sei un campione di Pac-Man!`
            : `Hai totalizzato ${gameState.score} punti! I fantasmini ti hanno preso, ma puoi riprovare subito!`
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
