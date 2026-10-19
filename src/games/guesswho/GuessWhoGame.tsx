import React, { useState, useEffect } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import {
  Character,
  Question,
  getQuestionsForDifficulty,
} from './guessWhoData';
import {
  GuessWhoState,
  createInitialGuessWhoState,
  askQuestionPlayer,
  togglePlayerCard,
  autoEliminatePendingCards,
  endPlayerTurn,
  playerGuessCharacter,
  executeBotTurn,
} from './guessWhoEngine';
import {
  HelpCircle,
  Sparkles,
  Eye,
  EyeOff,
  Target,
  ArrowRight,
  Bot,
  User,
  RotateCcw,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface GuessWhoGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

export const GuessWhoGame: React.FC<GuessWhoGameProps> = ({
  playMode: _playMode,
  difficulty,
  onOpenRules,
  onSelectGame,
}) => {
  const { theme, isDark } = useTheme();

  const [gameState, setGameState] = useState<GuessWhoState>(() =>
    createInitialGuessWhoState(difficulty)
  );

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [isSecretRevealed, setIsSecretRevealed] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [botMessage, setBotMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Tutti');

  const availableQuestions = getQuestionsForDifficulty(difficulty);

  // Handle Bot Turn automatically with a natural delay
  useEffect(() => {
    if (gameState.turn === 'bot' && !gameState.gameOver) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const { newState, botMessage: msg } = executeBotTurn(gameState, difficulty);
        sound.playMove();
        setGameState(newState);
        setBotMessage(msg);
        setIsBotThinking(false);
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.gameOver, difficulty]);

  // Restart match
  const handleRematch = () => {
    sound.playTick();
    setGameState(createInitialGuessWhoState(difficulty));
    setBotMessage(null);
    setIsQuestionModalOpen(false);
    setIsGuessModalOpen(false);
    setIsSecretRevealed(false);
  };

  // Flip card
  const handleCardClick = (charId: string) => {
    sound.playStone();
    setGameState((prev) => togglePlayerCard(prev, charId));
  };

  // Auto eliminate
  const handleAutoEliminate = () => {
    sound.playCapture();
    setGameState((prev) => autoEliminatePendingCards(prev));
  };

  // Player asks question
  const handleSelectQuestion = (q: Question) => {
    sound.playStone();
    setGameState((prev) => askQuestionPlayer(prev, q));
    setIsQuestionModalOpen(false);
    setBotMessage(null);
  };

  // Player confirms guess
  const handleConfirmGuess = (charId: string) => {
    sound.playStone();
    setIsGuessModalOpen(false);
    setGameState((prev) => playerGuessCharacter(prev, charId));
  };

  // End turn
  const handleEndTurn = () => {
    sound.playMove();
    setGameState((prev) => endPlayerTurn(prev));
  };

  const remainingPlayerCount =
    gameState.characters.length - gameState.playerEliminatedIds.length;
  const remainingBotCount =
    gameState.characters.length - gameState.botEliminatedIds.length;

  const categories = ['Tutti', 'Genere', 'Carnagione', 'Capelli', 'Dettagli'];

  const filteredQuestions = availableQuestions.filter((q) => {
    if (activeCategory === 'Tutti') return true;
    return q.category === activeCategory;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 flex flex-col items-center select-none pb-28">
      {/* Top Header Card: Status & Secret Character */}
      <div
        className={`w-full rounded-2xl p-3 sm:p-4 mb-3 border shadow-md flex flex-wrap items-center justify-between gap-3 ${theme.bgSurface} ${theme.borderSubtle}`}
      >
        {/* Left: Score / Remaining Counts */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1.5 rounded-xl border border-blue-500/30">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-black tracking-wide text-blue-600 dark:text-blue-400">
              TUOI: {remainingPlayerCount}/{gameState.characters.length}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30">
            <Bot className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black tracking-wide text-amber-600 dark:text-amber-400">
              BOT: {remainingBotCount}/{gameState.characters.length}
            </span>
          </div>
        </div>

        {/* Center: Secret Character Reveal Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSecretRevealed(!isSecretRevealed)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/25 transition-all text-xs font-bold"
            title="Mostra o nascondi il tuo personaggio segreto"
          >
            {isSecretRevealed ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Nascondi Segreto</span>
                <span className="text-lg leading-none">{gameState.playerSecret.emoji}</span>
                <span className="font-black text-purple-700 dark:text-purple-200">
                  {gameState.playerSecret.name}
                </span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Vedi il tuo Segreto 🤫</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenRules}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all text-stone-600 dark:text-stone-300"
            title="Regole"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={handleRematch}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all text-stone-600 dark:text-stone-300"
            title="Riavvia"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Turn & Status Alert Banner */}
      <div className="w-full mb-3">
        {isBotThinking ? (
          <div className="w-full p-3 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-900 dark:text-amber-100 flex items-center justify-center gap-2 text-sm font-black animate-pulse">
            <Bot className="w-5 h-5 animate-bounce" />
            <span>Il Bot sta esaminando le sue carte e riflettendo... 🤔</span>
          </div>
        ) : botMessage ? (
          <div className="w-full p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-100 flex items-center justify-between gap-2 text-xs sm:text-sm font-bold shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{botMessage}</span>
            </div>
            <button
              onClick={() => setBotMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 px-2 py-1 rounded bg-black/5 dark:bg-white/10"
            >
              OK
            </button>
          </div>
        ) : gameState.lastQuestion && gameState.lastQuestion.asker === 'player' ? (
          <div
            className={`w-full p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm ${
              gameState.lastQuestion.answer
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-100'
            }`}
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              {gameState.lastQuestion.answer ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <span>
                Hai chiesto: <strong>&quot;{gameState.lastQuestion.questionText}&quot;</strong> →{' '}
                <strong className="text-sm sm:text-base underline">
                  {gameState.lastQuestion.answer ? 'SÌ! ✅' : 'NO! ❌'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {gameState.pendingAutoEliminateIds.length > 0 && (
                <button
                  onClick={handleAutoEliminate}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Abbassa ({gameState.pendingAutoEliminateIds.length})
                </button>
              )}
              <button
                onClick={handleEndTurn}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1 active:scale-95"
              >
                Passa Turno <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-100 text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <span>È il tuo turno! Fai una domanda oppure tenta di indovinare il personaggio!</span>
          </div>
        )}
      </div>

      {/* Main Board Grid (Characters) */}
      <div
        className={`w-full p-3 sm:p-5 rounded-3xl border shadow-xl ${theme.bgCard} ${theme.borderSubtle}`}
      >
        <div
          className={`grid gap-2.5 sm:gap-3.5 ${
            gameState.characters.length === 12
              ? 'grid-cols-3 sm:grid-cols-4'
              : gameState.characters.length === 18
              ? 'grid-cols-3 sm:grid-cols-6'
              : 'grid-cols-4 sm:grid-cols-6'
          }`}
        >
          {gameState.characters.map((char) => {
            const isEliminated = gameState.playerEliminatedIds.includes(char.id);
            const isPendingAuto = gameState.pendingAutoEliminateIds.includes(char.id);

            return (
              <div
                key={char.id}
                onClick={() => handleCardClick(char.id)}
                className={`relative group rounded-2xl p-2 sm:p-2.5 cursor-pointer transition-all duration-200 flex flex-col items-center justify-between border-2 select-none ${
                  isEliminated
                    ? 'opacity-35 grayscale bg-stone-300 dark:bg-stone-800 border-dashed border-stone-400 dark:border-stone-700 scale-95'
                    : isPendingAuto
                    ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/50 animate-bounce'
                    : 'bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-lg active:scale-95'
                }`}
                style={{
                  minHeight: '100px',
                }}
              >
                {/* Visual Trait Badges top right */}
                <div className="absolute top-1 right-1 flex items-center gap-0.5 text-[10px] bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded-md">
                  {char.skin === 'light' && <span>🏻</span>}
                  {char.skin === 'medium' && <span>🏽</span>}
                  {char.skin === 'dark' && <span>🏿</span>}
                  {char.hasGlasses && <span>👓</span>}
                  {char.hasHat && <span>🧢</span>}
                  {char.hasBeard && <span>🧔</span>}
                </div>

                {/* Character Emoji */}
                <div className="text-3xl sm:text-4xl my-1 transition-transform group-hover:scale-110">
                  {char.emoji}
                </div>

                {/* Name */}
                <div
                  className={`font-black text-xs tracking-tight text-center truncate w-full ${
                    isEliminated
                      ? 'text-stone-400 dark:text-stone-600 line-through'
                      : 'text-stone-900 dark:text-stone-100'
                  }`}
                >
                  {char.name}
                </div>

                {/* Eliminated Flip-Down Stamp */}
                {isEliminated && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black tracking-wider uppercase bg-stone-900/80 text-white px-2 py-0.5 rounded-full transform -rotate-12 shadow">
                      ESCLUSO
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex items-center justify-center gap-3 z-30">
        <button
          onClick={() => {
            sound.playTick();
            setIsQuestionModalOpen(true);
          }}
          disabled={gameState.turn !== 'player' || isBotThinking}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
            gameState.turn === 'player' && !isBotThinking
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-600 shadow-amber-500/30'
              : 'bg-stone-300 dark:bg-stone-800 text-stone-500 border-transparent cursor-not-allowed opacity-60'
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          <span>Fai una Domanda ❓</span>
        </button>

        <button
          onClick={() => {
            sound.playTick();
            setIsGuessModalOpen(true);
          }}
          disabled={gameState.turn !== 'player' || isBotThinking}
          className={`py-3.5 px-5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
            gameState.turn === 'player' && !isBotThinking
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-700 shadow-rose-600/30'
              : 'bg-stone-300 dark:bg-stone-800 text-stone-500 border-transparent cursor-not-allowed opacity-60'
          }`}
        >
          <Target className="w-5 h-5" />
          <span>Indovina! 🎯</span>
        </button>
      </div>

      {/* MODAL: Question Picker */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl p-5 shadow-2xl border flex flex-col max-h-[85vh] ${theme.bgSurface} ${theme.borderSubtle} ${theme.textPrimary}`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base">Scegli la tua domanda</h3>
              </div>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                    activeCategory === cat
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'bg-black/5 dark:bg-white/10 text-stone-600 dark:text-stone-300 hover:bg-black/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
              {filteredQuestions.map((q) => {
                const wasAsked = gameState.askedQuestionIds.includes(q.id);
                return (
                  <button
                    key={q.id}
                    disabled={wasAsked}
                    onClick={() => handleSelectQuestion(q)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      wasAsked
                        ? 'opacity-40 bg-black/5 dark:bg-white/5 border-transparent cursor-not-allowed'
                        : 'bg-black/5 dark:bg-white/5 hover:bg-amber-500/20 border-black/5 dark:border-white/10 hover:border-amber-500 active:scale-98'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{q.categoryIcon}</span>
                      <span className="text-sm font-bold">{q.text}</span>
                    </div>
                    {wasAsked ? (
                      <span className="text-[10px] font-black uppercase text-stone-400">
                        Già fatta
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 opacity-50 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Guess the Character */}
      {isGuessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl p-5 shadow-2xl border flex flex-col max-h-[85vh] ${theme.bgSurface} ${theme.borderSubtle} ${theme.textPrimary}`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-500" />
                <h3 className="font-black text-base">Chi è il personaggio segreto?</h3>
              </div>
              <button
                onClick={() => setIsGuessModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 my-2">
              Tocca il personaggio che pensi sia quello segreto del tuo avversario. Se sbagli,
              passerai il turno!
            </p>

            {/* Candidates Grid */}
            <div className="flex-1 overflow-y-auto py-2 grid grid-cols-3 sm:grid-cols-4 gap-2 pr-1">
              {gameState.characters.map((c) => {
                const isEliminated = gameState.playerEliminatedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleConfirmGuess(c.id)}
                    className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                      isEliminated
                        ? 'opacity-40 bg-black/5 dark:bg-white/5 border-transparent'
                        : 'bg-black/5 dark:bg-white/10 hover:bg-rose-500/20 border-rose-500/30 hover:border-rose-500 active:scale-95 shadow-sm'
                    }`}
                  >
                    <span className="text-3xl my-1">{c.emoji}</span>
                    <span className="font-black text-xs truncate w-full text-center">
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 'player'
            ? 'HAI VINTO TU! 🏆'
            : 'HA VINTO IL BOT! 🤖'
        }
        winnerSubtitle={gameState.winnerReason}
        isDraw={false}
        onRematch={handleRematch}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
