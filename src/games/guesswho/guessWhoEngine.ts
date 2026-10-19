import { Difficulty } from '../../types/game';
import {
  Character,
  Question,
  getCharactersForDifficulty,
  getQuestionsForDifficulty,
} from './guessWhoData';

export interface HistoryItem {
  round: number;
  asker: 'player' | 'bot';
  text: string;
  answer: boolean;
}

export interface GuessWhoState {
  characters: Character[];
  playerSecret: Character;
  botSecret: Character;
  playerEliminatedIds: string[];
  botEliminatedIds: string[];
  turn: 'player' | 'bot';
  roundNumber: number;
  lastQuestion: {
    asker: 'player' | 'bot';
    questionText: string;
    answer: boolean;
    questionId: string;
  } | null;
  pendingAutoEliminateIds: string[];
  askedQuestionIds: string[];
  botAskedQuestionIds: string[];
  gameOver: boolean;
  winner: 'player' | 'bot' | null;
  winnerReason: string;
  history: HistoryItem[];
}

export function createInitialGuessWhoState(difficulty: Difficulty): GuessWhoState {
  const characters = getCharactersForDifficulty(difficulty);
  const playerSecret = characters[Math.floor(Math.random() * characters.length)];
  const botSecret = characters[Math.floor(Math.random() * characters.length)];

  return {
    characters,
    playerSecret,
    botSecret,
    playerEliminatedIds: [],
    botEliminatedIds: [],
    turn: 'player',
    roundNumber: 1,
    lastQuestion: null,
    pendingAutoEliminateIds: [],
    askedQuestionIds: [],
    botAskedQuestionIds: [],
    gameOver: false,
    winner: null,
    winnerReason: '',
    history: [],
  };
}

export function askQuestionPlayer(
  state: GuessWhoState,
  question: Question
): GuessWhoState {
  if (state.gameOver || state.turn !== 'player') return state;

  // Bot answers truthfully about botSecret
  const answer = question.check(state.botSecret);

  // Determine which of the remaining player cards don't match this answer
  const pendingAuto: string[] = [];
  state.characters.forEach((char) => {
    if (!state.playerEliminatedIds.includes(char.id)) {
      const match = question.check(char);
      if (match !== answer) {
        pendingAuto.push(char.id);
      }
    }
  });

  const historyItem: HistoryItem = {
    round: state.roundNumber,
    asker: 'player',
    text: question.text,
    answer,
  };

  return {
    ...state,
    lastQuestion: {
      asker: 'player',
      questionText: question.text,
      answer,
      questionId: question.id,
    },
    pendingAutoEliminateIds: pendingAuto,
    askedQuestionIds: [...state.askedQuestionIds, question.id],
    history: [historyItem, ...state.history],
  };
}

export function togglePlayerCard(
  state: GuessWhoState,
  characterId: string
): GuessWhoState {
  const isEliminated = state.playerEliminatedIds.includes(characterId);
  const newEliminated = isEliminated
    ? state.playerEliminatedIds.filter((id) => id !== characterId)
    : [...state.playerEliminatedIds, characterId];

  // Also clear it from pending auto-eliminate if toggled
  const newPending = state.pendingAutoEliminateIds.filter((id) => id !== characterId);

  return {
    ...state,
    playerEliminatedIds: newEliminated,
    pendingAutoEliminateIds: newPending,
  };
}

export function autoEliminatePendingCards(state: GuessWhoState): GuessWhoState {
  const combined = Array.from(
    new Set([...state.playerEliminatedIds, ...state.pendingAutoEliminateIds])
  );
  return {
    ...state,
    playerEliminatedIds: combined,
    pendingAutoEliminateIds: [],
  };
}

export function endPlayerTurn(state: GuessWhoState): GuessWhoState {
  if (state.gameOver || state.turn !== 'player') return state;
  return {
    ...state,
    turn: 'bot',
    pendingAutoEliminateIds: [],
  };
}

export function playerGuessCharacter(
  state: GuessWhoState,
  characterId: string
): GuessWhoState {
  if (state.gameOver) return state;

  const guessedChar = state.characters.find((c) => c.id === characterId);
  const isCorrect = characterId === state.botSecret.id;

  if (isCorrect) {
    return {
      ...state,
      gameOver: true,
      winner: 'player',
      winnerReason: `Hai indovinato! Il personaggio segreto dell'avversario era proprio ${guessedChar?.name || 'il personaggio'}! 🎉`,
    };
  } else {
    // Incorrect guess: turn passes to bot
    return {
      ...state,
      turn: 'bot',
      pendingAutoEliminateIds: [],
      history: [
        {
          round: state.roundNumber,
          asker: 'player',
          text: `Tentativo: è ${guessedChar?.name}?`,
          answer: false,
        },
        ...state.history,
      ],
      lastQuestion: {
        asker: 'player',
        questionText: `Tentativo: è ${guessedChar?.name}?`,
        answer: false,
        questionId: 'guess',
      },
    };
  }
}

export function executeBotTurn(
  state: GuessWhoState,
  difficulty: Difficulty
): { newState: GuessWhoState; botMessage: string } {
  if (state.gameOver || state.turn !== 'bot') {
    return { newState: state, botMessage: '' };
  }

  const botCandidates = state.characters.filter(
    (c) => !state.botEliminatedIds.includes(c.id)
  );

  // 1. If only 1 candidate left, Bot guesses it!
  if (botCandidates.length === 1) {
    const candidate = botCandidates[0];
    const isCorrect = candidate.id === state.playerSecret.id;
    if (isCorrect) {
      return {
        newState: {
          ...state,
          gameOver: true,
          winner: 'bot',
          winnerReason: `Il Bot ha indovinato! Il tuo personaggio era ${candidate.name} ${candidate.emoji}!`,
          turn: 'player',
        },
        botMessage: `Il Bot indovina: "Il tuo personaggio è ${candidate.name}!" ed ha ragione! 🤖🏆`,
      };
    }
  }

  // 2. If 2 candidates left on Hard, 50% chance to take a guess
  if (botCandidates.length === 2 && difficulty === 'hard' && Math.random() < 0.5) {
    const guessed = botCandidates[Math.floor(Math.random() * botCandidates.length)];
    if (guessed.id === state.playerSecret.id) {
      return {
        newState: {
          ...state,
          gameOver: true,
          winner: 'bot',
          winnerReason: `Il Bot ha indovinato! Il tuo personaggio era ${guessed.name} ${guessed.emoji}!`,
          turn: 'player',
        },
        botMessage: `Il Bot tenta il colpo: "${guessed.name}!" ed indovina! 🤖🏆`,
      };
    } else {
      // Bot guessed wrong, eliminate that candidate and give turn back
      const newBotElim = [...state.botEliminatedIds, guessed.id];
      return {
        newState: {
          ...state,
          botEliminatedIds: newBotElim,
          turn: 'player',
          roundNumber: state.roundNumber + 1,
        },
        botMessage: `Il Bot ha provato ad indovinare "${guessed.name}", ma ha sbagliato! Tocca a te!`,
      };
    }
  }

  // 3. Otherwise pick an optimal question
  const availableQuestions = getQuestionsForDifficulty(difficulty).filter(
    (q) => !state.botAskedQuestionIds.includes(q.id)
  );

  // Score questions by how well they split the remaining candidates
  const scored = availableQuestions
    .map((q) => {
      const matchCount = botCandidates.filter((c) => q.check(c)).length;
      const failCount = botCandidates.length - matchCount;
      const splitDiff = Math.abs(matchCount - failCount);
      const isUseless = matchCount === 0 || failCount === 0;
      return { q, matchCount, failCount, splitDiff, isUseless };
    })
    .filter((item) => !item.isUseless);

  let chosenQuestion: Question;

  if (scored.length === 0) {
    // Fallback: pick any question or attempt a guess on first candidate
    if (botCandidates.length > 0) {
      const target = botCandidates[0];
      const isCorrect = target.id === state.playerSecret.id;
      return {
        newState: {
          ...state,
          gameOver: isCorrect,
          winner: isCorrect ? 'bot' : null,
          winnerReason: isCorrect
            ? `Il Bot ha indovinato! Era ${target.name} ${target.emoji}!`
            : '',
          turn: 'player',
          roundNumber: state.roundNumber + 1,
        },
        botMessage: `Il Bot tenta: "È ${target.name}?" ${isCorrect ? 'ED È GIUSTO!' : 'Sbagliato!'}`,
      };
    }
    return {
      newState: { ...state, turn: 'player', roundNumber: state.roundNumber + 1 },
      botMessage: 'Il Bot passa il turno.',
    };
  }

  if (difficulty === 'easy') {
    // Easy: random scored question
    chosenQuestion = scored[Math.floor(Math.random() * scored.length)].q;
  } else if (difficulty === 'medium') {
    // Medium: pick among top 3
    scored.sort((a, b) => a.splitDiff - b.splitDiff);
    const topCandidates = scored.slice(0, Math.min(3, scored.length));
    chosenQuestion = topCandidates[Math.floor(Math.random() * topCandidates.length)].q;
  } else {
    // Hard: strictly minimize splitDiff (bisection / minimax strategy!)
    scored.sort((a, b) => a.splitDiff - b.splitDiff);
    chosenQuestion = scored[0].q;
  }

  // Answer is calculated based on player's secret
  const answer = chosenQuestion.check(state.playerSecret);

  // Bot eliminates characters that don't match the answer
  const newlyEliminatedByBot: string[] = [];
  botCandidates.forEach((c) => {
    if (chosenQuestion.check(c) !== answer) {
      newlyEliminatedByBot.push(c.id);
    }
  });

  const updatedBotEliminated = [...state.botEliminatedIds, ...newlyEliminatedByBot];
  const remainingCount = state.characters.length - updatedBotEliminated.length;

  const historyItem: HistoryItem = {
    round: state.roundNumber,
    asker: 'bot',
    text: chosenQuestion.text,
    answer,
  };

  const botMessage = `Il Bot chiede: "${chosenQuestion.text}" → Risposta: ${
    answer ? 'SÌ! ✅' : 'NO! ❌'
  }. Al Bot restano ${remainingCount} possibili personaggi.`;

  return {
    newState: {
      ...state,
      botEliminatedIds: updatedBotEliminated,
      botAskedQuestionIds: [...state.botAskedQuestionIds, chosenQuestion.id],
      lastQuestion: {
        asker: 'bot',
        questionText: chosenQuestion.text,
        answer,
        questionId: chosenQuestion.id,
      },
      turn: 'player',
      roundNumber: state.roundNumber + 1,
      history: [historyItem, ...state.history],
    },
    botMessage,
  };
}
