import React, { useState, useEffect, useRef } from 'react';
import { PlayMode, Difficulty } from '../../types/game';
import { useTheme } from '../../theme/themeContext';
import { sound } from '../../utils/audio';
import { VictoryModal } from '../../components/VictoryModal';
import { TabletopPlayerBar } from '../../components/TabletopPlayerBar';
import {
  UnoState,
  UnoCard,
  CardColor,
  createInitialUnoState,
  playCardAction,
  drawCardAction,
  botPickMove,
  canPlayCard,
  getTopCard,
  colorName,
} from './unoEngine';
import { Sparkles, RotateCw, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

interface UnoGameProps {
  playMode: PlayMode;
  difficulty: Difficulty;
  onOpenRules: () => void;
  onSelectGame: () => void;
  isTabletFlipped?: boolean;
}

// Single card graphic renderer
export const UnoCardView: React.FC<{
  card: UnoCard;
  isPlayable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  isFlipped?: boolean;
}> = ({ card, isPlayable = false, onClick, size = 'md', isFlipped = false }) => {
  if (isFlipped) {
    // Card back
    return (
      <div
        onClick={onClick}
        className={`relative aspect-[2/3] rounded-xl sm:rounded-2xl bg-gradient-to-br from-stone-900 to-black border-2 border-stone-700 shadow-md flex items-center justify-center select-none ${
          size === 'sm'
            ? 'w-11 sm:w-14'
            : size === 'lg'
            ? 'w-24 sm:w-32 md:w-36'
            : 'w-16 sm:w-20 md:w-24'
        }`}
      >
        <div className="w-[82%] h-[68%] rounded-full bg-red-600 border border-amber-300 transform -rotate-25 flex items-center justify-center shadow-inner">
          <span className="font-black italic text-amber-300 tracking-tighter text-xs sm:text-base md:text-lg">
            UNO
          </span>
        </div>
      </div>
    );
  }

  // Card color theme
  let bgGradient = 'bg-stone-800';
  let borderColor = 'border-stone-600';
  let textColor = 'text-white';

  if (card.color === 'red') {
    bgGradient = 'bg-gradient-to-br from-red-500 to-red-600';
    borderColor = 'border-red-400';
  } else if (card.color === 'yellow') {
    bgGradient = 'bg-gradient-to-br from-amber-400 to-amber-500';
    borderColor = 'border-amber-300';
    textColor = 'text-stone-950';
  } else if (card.color === 'green') {
    bgGradient = 'bg-gradient-to-br from-emerald-500 to-emerald-600';
    borderColor = 'border-emerald-400';
  } else if (card.color === 'blue') {
    bgGradient = 'bg-gradient-to-br from-blue-500 to-blue-600';
    borderColor = 'border-blue-400';
  } else if (card.color === 'wild') {
    bgGradient = 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950';
    borderColor = 'border-amber-400 ring-1 ring-amber-300';
  }

  // Symbol label
  let symbolText: string = card.value;
  if (card.value === 'draw2') symbolText = '+2';
  else if (card.value === 'skip') symbolText = '🚫';
  else if (card.value === 'reverse') symbolText = '🔁';
  else if (card.value === 'wild') symbolText = '🌈';
  else if (card.value === 'wild4') symbolText = '🌈+4';

  const widthClass =
    size === 'sm'
      ? 'w-11 sm:w-14'
      : size === 'lg'
      ? 'w-24 sm:w-32 md:w-36'
      : 'w-16 sm:w-20 md:w-24';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick || !isPlayable}
      className={`relative aspect-[2/3] rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-lg border-2 ${bgGradient} ${borderColor} select-none transition-all duration-200 flex flex-col justify-between items-center ${widthClass} ${
        isPlayable
          ? 'hover:-translate-y-3 cursor-pointer ring-4 ring-amber-300/80 scale-105 active:scale-95 shadow-amber-400/40'
          : onClick
          ? 'opacity-85 hover:opacity-100'
          : ''
      }`}
    >
      {/* Top Left Mini Value */}
      <span
        className={`self-start text-[10px] sm:text-xs md:text-sm font-black leading-none ${textColor}`}
      >
        {symbolText}
      </span>

      {/* Center White Oval Graphic */}
      <div className="w-[85%] h-[64%] rounded-full bg-white/95 shadow-inner border border-black/10 transform -rotate-20 flex items-center justify-center my-auto">
        {card.color === 'wild' ? (
          <div className="flex flex-col items-center justify-center">
            <span className="text-base sm:text-2xl md:text-3xl leading-none">🌈</span>
            {card.value === 'wild4' && (
              <span className="font-black text-rose-600 text-xs sm:text-sm md:text-base leading-none">
                +4
              </span>
            )}
          </div>
        ) : (
          <span
            className={`font-black text-base sm:text-2xl md:text-3xl ${
              card.color === 'red'
                ? 'text-red-600'
                : card.color === 'yellow'
                ? 'text-amber-500'
                : card.color === 'green'
                ? 'text-emerald-600'
                : 'text-blue-600'
            }`}
          >
            {symbolText}
          </span>
        )}
      </div>

      {/* Bottom Right Mini Value (rotated 180) */}
      <span
        className={`self-end text-[10px] sm:text-xs md:text-sm font-black leading-none transform rotate-180 ${textColor}`}
      >
        {symbolText}
      </span>
    </button>
  );
};

export const UnoGame: React.FC<UnoGameProps> = ({
  playMode,
  onSelectGame,
  isTabletFlipped,
}) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<UnoState>(createInitialUnoState());
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [p2ShowCards, setP2ShowCards] = useState(false); // privacy toggle for 1v1 local
  const isMountedRef = useRef(true);

  const topCard = getTopCard(gameState);
  const activeTurn = gameState.turn;
  const isP1Turn = activeTurn === 0;
  const isPvP = playMode === 'local_pvp';

  // BOT AI turn handling
  useEffect(() => {
    isMountedRef.current = true;
    if (playMode === 'bot' && activeTurn === 1 && !gameState.gameOver && gameState.currentColorChooser === null) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        if (!isMountedRef.current) return;
        const move = botPickMove(gameState);
        if (move) {
          sound.playCard();
          setGameState((prev) => {
            const next = playCardAction(prev, move.cardId, move.chosenColor);
            return next || prev;
          });
        } else {
          // Bot must draw
          sound.playCard();
          setGameState((prev) => drawCardAction(prev));
        }
        setIsBotThinking(false);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [activeTurn, playMode, gameState.gameOver, gameState.currentColorChooser]);

  // Player 1 or 2 plays card
  const handlePlayCard = (cardId: string) => {
    if (gameState.gameOver || isBotThinking || gameState.currentColorChooser !== null) return;
    if (!isPvP && activeTurn !== 0) return;

    const hand = gameState.hands[activeTurn];
    const card = hand.find((c) => c.id === cardId);
    if (!card) return;

    if (!canPlayCard(card, topCard, gameState.activeColor)) {
      sound.playMiss();
      return;
    }

    sound.playCard();

    // Check if playing Wild card (will trigger color picker modal)
    const nextState = playCardAction(gameState, cardId);
    if (nextState) {
      if (nextState.gameOver) sound.playWin();
      else if (nextState.calledUno[activeTurn]) sound.playUno();
      setGameState(nextState);
    }
  };

  // Color picker selection for Wild cards
  const handleSelectWildColor = (chosenColor: 'red' | 'yellow' | 'green' | 'blue') => {
    if (gameState.currentColorChooser === null) return;
    sound.playTick();

    const chooser = gameState.currentColorChooser;
    const nextPlayer: 0 | 1 = chooser === 0 ? 1 : 0;
    const top = getTopCard(gameState);

    let nextTurn = nextPlayer;
    let message = `🌈 Colore cambiato in ${colorName(chosenColor)}!`;

    if (top.value === 'wild4') {
      message = `🌈 +4! ${nextPlayer === 0 ? 'Il Giocatore 1' : "L'avversario"} pesca 4 carte e il colore diventa ${colorName(chosenColor)}!`;
    }

    setGameState((prev) => ({
      ...prev,
      activeColor: chosenColor,
      currentColorChooser: null,
      turn: nextTurn,
      lastActionMessage: message,
    }));
  };

  // Draw card from deck
  const handleDrawCard = () => {
    if (gameState.gameOver || isBotThinking || gameState.currentColorChooser !== null) return;
    if (!isPvP && activeTurn !== 0) return;

    sound.playCard();
    setGameState((prev) => drawCardAction(prev));
  };

  // Call UNO manually
  const handleCallUno = () => {
    sound.playUno();
    setGameState((prev) => {
      const nextCalled = [...prev.calledUno] as [boolean, boolean];
      nextCalled[activeTurn] = true;
      return {
        ...prev,
        calledUno: nextCalled,
        unoAlert: `🎉 ${activeTurn === 0 ? 'Hai gridato' : 'Giocatore 2 grida'} UNO!`,
      };
    });
  };

  const handleRestart = () => {
    sound.playTick();
    setGameState(createInitialUnoState());
    setIsBotThinking(false);
  };

  const p1Name = 'Giocatore 1 (Blu)';
  const p2Name = playMode === 'bot' ? 'UNO BOT 🤖' : 'Giocatore 2 (Rosso)';

  const activeColorBg =
    gameState.activeColor === 'red'
      ? 'bg-red-500 ring-red-300'
      : gameState.activeColor === 'yellow'
      ? 'bg-amber-400 ring-amber-200'
      : gameState.activeColor === 'green'
      ? 'bg-emerald-500 ring-emerald-300'
      : 'bg-blue-500 ring-blue-300';

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-5xl md:max-w-6xl xl:max-w-7xl mx-auto px-2 sm:px-4 flex-1 h-full min-h-0 select-none">
      {/* Top Player Indicator (P2 / BOT: rotated 180 in local 1v1 tabletop) */}
      <TabletopPlayerBar
        playerNumber={2}
        playerName={p2Name}
        color="#ec4899"
        pieceIcon={<span className="text-sm">🃏</span>}
        isCurrentTurn={gameState.turn === 1 && !gameState.gameOver}
        isFlipped={playMode === 'local_pvp'}
        score={`Carte: ${gameState.hands[1].length}`}
      />

      {/* Opponent Hand (Top) */}
      <div className="w-full flex justify-center items-center my-1">
        {playMode === 'bot' ? (
          // In BOT mode, show stack of cards facing down
          <div className="flex items-center -space-x-8 sm:-space-x-12 overflow-x-auto py-1 px-4 max-w-full">
            {gameState.hands[1].map((card, i) => (
              <div key={card.id || i} className="transform hover:-translate-y-1 transition-transform">
                <UnoCardView card={card} isFlipped size="sm" />
              </div>
            ))}
          </div>
        ) : (
          // In 1v1 local, show privacy toggle button or flipped hand
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setP2ShowCards(!p2ShowCards)}
                className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                {p2ShowCards ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{p2ShowCards ? 'Nascondi Carte G2' : 'Mostra Carte G2 (Turno tuo)'}</span>
              </button>
            </div>

            <div className="flex items-center -space-x-8 sm:-space-x-12 overflow-x-auto py-1 px-4 max-w-full">
              {gameState.hands[1].map((card) => {
                const playable = activeTurn === 1 && canPlayCard(card, topCard, gameState.activeColor);
                return (
                  <div key={card.id} className="transform hover:-translate-y-1 transition-transform">
                    <UnoCardView
                      card={card}
                      isFlipped={!p2ShowCards}
                      isPlayable={playable && p2ShowCards}
                      onClick={() => p2ShowCards && handlePlayCard(card.id)}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Center Tabletop Green Arena */}
      <div
        className="relative w-full my-auto p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-between transition-all"
        style={{ backgroundColor: '#1e5138' }}
      >
        {/* Active Color & Turn Badge Banner */}
        <div className="flex items-center justify-between w-full mb-3 px-2">
          {/* Active Color Indicator Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-white/20 shadow-md">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Colore Attivo:
            </span>
            <div className={`w-4 h-4 rounded-full ring-2 shadow ${activeColorBg}`} />
            <span className="text-xs font-black text-white">
              {colorName(gameState.activeColor)}
            </span>
          </div>

          {/* Action Message */}
          <div className="text-xs sm:text-sm font-black text-amber-200 drop-shadow text-center max-w-sm truncate">
            {isBotThinking ? 'Il BOT sta pensando alla mossa... 🤔' : gameState.lastActionMessage}
          </div>

          {/* Restart Button */}
          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all shadow-md active:scale-95"
            title="Nuova Partita"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Center Discard & Draw Decks */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-14 my-3">
          {/* Draw Deck (Mazzo di Pesca) */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleDrawCard}
              disabled={isBotThinking || gameState.gameOver || (!isPvP && activeTurn !== 0)}
              className="group relative cursor-pointer active:scale-95 transition-transform"
              title="Pesca una carta"
            >
              {/* Stack shadow effect */}
              <div className="absolute inset-0 bg-stone-900 rounded-2xl transform translate-x-1.5 translate-y-1.5 opacity-60" />
              <UnoCardView
                card={{ id: 'deck_back', color: 'wild', value: 'wild' }}
                isFlipped
                size="lg"
              />
              <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] sm:text-xs font-black shadow-md uppercase">
                PESCA ({gameState.deck.length})
              </div>
            </button>
          </div>

          {/* Top Discarded Card (Mazzo Scarti) */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Glow ring of the active color around discard pile */}
              <div
                className={`absolute -inset-2.5 rounded-3xl opacity-80 blur-sm ${activeColorBg} transition-all duration-300`}
              />
              <UnoCardView card={topCard} size="lg" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-white/80 mt-2">
              SCARTI ({gameState.discardPile.length})
            </span>
          </div>

          {/* UNO Button Callout */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleCallUno}
              disabled={gameState.gameOver}
              className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full font-black text-xs sm:text-sm md:text-base border-4 border-amber-300 shadow-2xl flex items-center justify-center transition-all ${
                gameState.hands[activeTurn].length <= 2
                  ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white animate-bounce ring-4 ring-amber-400 scale-105 active:scale-95 cursor-pointer'
                  : 'bg-stone-800 text-stone-400 border-stone-600 opacity-60'
              }`}
              title="Grida UNO!"
            >
              UNO!
            </button>
            <span className="text-[10px] text-white/70 font-semibold mt-1">Grida UNO!</span>
          </div>
        </div>

        {/* UNO Alert Banner */}
        {gameState.unoAlert && (
          <div className="w-full bg-amber-400/90 text-stone-950 font-black px-4 py-1.5 rounded-xl text-xs sm:text-sm text-center shadow-md animate-pulse">
            {gameState.unoAlert}
          </div>
        )}
      </div>

      {/* Player 1 Hand (Bottom) */}
      <div className="w-full flex flex-col items-center my-2">
        <div className="text-xs font-bold text-white/90 mb-1 flex items-center gap-1.5">
          <span>Le Tue Carte:</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/40 text-white text-[11px] font-black">
            {gameState.hands[0].length}
          </span>
          {isP1Turn && !gameState.gameOver && (
            <span className="text-amber-300 animate-pulse font-black text-xs">
              · È il tuo turno! Tocca una carta bordata d'oro per giocarla
            </span>
          )}
        </div>

        {/* Horizontal fanned cards */}
        <div className="flex items-center -space-x-6 sm:-space-x-8 md:-space-x-10 overflow-x-auto py-3 px-6 max-w-full no-scrollbar">
          {gameState.hands[0].map((card) => {
            const playable = isP1Turn && canPlayCard(card, topCard, gameState.activeColor);
            return (
              <div key={card.id} className="transition-transform">
                <UnoCardView
                  card={card}
                  isPlayable={playable}
                  onClick={() => handlePlayCard(card.id)}
                  size="md"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Player Indicator (P1) */}
      <TabletopPlayerBar
        playerNumber={1}
        playerName={p1Name}
        color="#3b82f6"
        pieceIcon={<span className="text-sm">🃏</span>}
        isCurrentTurn={gameState.turn === 0 && !gameState.gameOver}
        isFlipped={false}
        score={`Carte: ${gameState.hands[0].length}`}
      />

      {/* Wild Color Selection Modal */}
      {gameState.currentColorChooser !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-900 border-4 border-amber-400 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95">
            <span className="text-4xl mb-2">🌈</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
              Carta Jolly! Scegli il Colore
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mb-6">
              Tocca il colore con cui vuoi continuare la partita:
            </p>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => handleSelectWildColor('red')}
                className="py-4 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 border-2 border-red-300"
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
                <span>ROSSO</span>
              </button>

              <button
                onClick={() => handleSelectWildColor('yellow')}
                className="py-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 border-2 border-amber-200"
              >
                <div className="w-4 h-4 rounded-full bg-stone-950 shadow" />
                <span>GIALLO</span>
              </button>

              <button
                onClick={() => handleSelectWildColor('green')}
                className="py-4 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 border-2 border-emerald-300"
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
                <span>VERDE</span>
              </button>

              <button
                onClick={() => handleSelectWildColor('blue')}
                className="py-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-base shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 border-2 border-blue-300"
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
                <span>BLU</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      <VictoryModal
        isOpen={gameState.gameOver}
        winnerTitle={
          gameState.winner === 0
            ? 'Vittoria! Hai finito tutte le carte! 🏆🎉'
            : playMode === 'bot'
            ? 'Il BOT ha finito le carte! 🤖'
            : 'Vince il Giocatore 2! 🏆🎉'
        }
        winnerSubtitle={
          gameState.winner === 0
            ? playMode === 'bot'
              ? 'Bravissimo! Hai battuto il BOT a UNO! Campione delle carte!'
              : 'Complimenti al Giocatore 1!'
            : playMode === 'bot'
            ? 'Il BOT è stato fortunato questa volta. Giochiamo la rivincita?'
            : 'Complimenti al Giocatore 2!'
        }
        onRematch={handleRestart}
        onSelectGame={onSelectGame}
      />
    </div>
  );
};
