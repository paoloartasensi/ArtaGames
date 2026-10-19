import { Difficulty } from '../../types/game';

export type Gender = 'M' | 'F';
export type SkinTone = 'light' | 'medium' | 'dark';
export type HairColor = 'blond' | 'dark' | 'red' | 'white' | 'bald';

export interface Character {
  id: string;
  name: string;
  emoji: string;
  gender: Gender;
  skin: SkinTone;
  hair: HairColor;
  isCurly: boolean;
  hasGlasses: boolean;
  hasHat: boolean;
  hasBeard: boolean;
}

export interface Question {
  id: string;
  text: string;
  category: 'Genere' | 'Carnagione' | 'Capelli' | 'Dettagli';
  categoryIcon: string;
  check: (c: Character) => boolean;
  minDifficulty: Difficulty;
}

export const ALL_CHARACTERS: Character[] = [
  // --- CARNAGIONE CHIARA (8) ---
  {
    id: 'leo',
    name: 'Leo',
    emoji: '👦🏻',
    gender: 'M',
    skin: 'light',
    hair: 'dark',
    isCurly: false,
    hasGlasses: false,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'marco',
    name: 'Marco',
    emoji: '🧔🏻‍♂️',
    gender: 'M',
    skin: 'light',
    hair: 'dark',
    isCurly: false,
    hasGlasses: false,
    hasHat: true,
    hasBeard: true,
  },
  {
    id: 'pietro',
    name: 'Pietro',
    emoji: '👴🏻',
    gender: 'M',
    skin: 'light',
    hair: 'white',
    isCurly: false,
    hasGlasses: true,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'matteo',
    name: 'Matteo',
    emoji: '👱🏻‍♂️',
    gender: 'M',
    skin: 'light',
    hair: 'blond',
    isCurly: true,
    hasGlasses: false,
    hasHat: true,
    hasBeard: false,
  },
  {
    id: 'sofia',
    name: 'Sofia',
    emoji: '👱🏻‍♀️',
    gender: 'F',
    skin: 'light',
    hair: 'blond',
    isCurly: false,
    hasGlasses: true,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'giulia',
    name: 'Giulia',
    emoji: '👧🏼',
    gender: 'F',
    skin: 'light',
    hair: 'blond',
    isCurly: false,
    hasGlasses: false,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'chiara',
    name: 'Chiara',
    emoji: '👩🏻‍🦰',
    gender: 'F',
    skin: 'light',
    hair: 'red',
    isCurly: true,
    hasGlasses: false,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'beatrice',
    name: 'Beatrice',
    emoji: '👵🏻',
    gender: 'F',
    skin: 'light',
    hair: 'white',
    isCurly: false,
    hasGlasses: true,
    hasHat: false,
    hasBeard: false,
  },

  // --- CARNAGIONE MEDIA (8) ---
  {
    id: 'samuele',
    name: 'Samuele',
    emoji: '👨🏽‍🦱',
    gender: 'M',
    skin: 'medium',
    hair: 'dark',
    isCurly: true,
    hasGlasses: true,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'luca',
    name: 'Luca',
    emoji: '👱🏽‍♂️',
    gender: 'M',
    skin: 'medium',
    hair: 'blond',
    isCurly: false,
    hasGlasses: false,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'tarek',
    name: 'Tarek',
    emoji: '🧔🏽‍♂️',
    gender: 'M',
    skin: 'medium',
    hair: 'dark',
    isCurly: false,
    hasGlasses: false,
    hasHat: false,
    hasBeard: true,
  },
  {
    id: 'davide',
    name: 'Davide',
    emoji: '👨🏽‍🦰',
    gender: 'M',
    skin: 'medium',
    hair: 'red',
    isCurly: false,
    hasGlasses: false,
    hasHat: true,
    hasBeard: false,
  },
  {
    id: 'chloe',
    name: 'Chloe',
    emoji: '👩🏽‍🦰',
    gender: 'F',
    skin: 'medium',
    hair: 'red',
    isCurly: false,
    hasGlasses: false,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'elena',
    name: 'Elena',
    emoji: '👩🏽',
    gender: 'F',
    skin: 'medium',
    hair: 'dark',
    isCurly: false,
    hasGlasses: false,
    hasHat: true,
    hasBeard: false,
  },
  {
    id: 'maya',
    name: 'Maya',
    emoji: '👩🏽‍🦱',
    gender: 'F',
    skin: 'medium',
    hair: 'dark',
    isCurly: true,
    hasGlasses: true,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'camilla',
    name: 'Camilla',
    emoji: '👱🏽‍♀️',
    gender: 'F',
    skin: 'medium',
    hair: 'blond',
    isCurly: false,
    hasGlasses: false,
    hasHat: true,
    hasBeard: false,
  },

  // --- CARNAGIONE SCURA (8) ---
  {
    id: 'dario',
    name: 'Dario',
    emoji: '👨🏿‍🦲',
    gender: 'M',
    skin: 'dark',
    hair: 'bald',
    isCurly: false,
    hasGlasses: false,
    hasHat: false,
    hasBeard: true,
  },
  {
    id: 'malik',
    name: 'Malik',
    emoji: '👨🏾',
    gender: 'M',
    skin: 'dark',
    hair: 'dark',
    isCurly: false,
    hasGlasses: false,
    hasHat: true,
    hasBeard: false,
  },
  {
    id: 'bruno',
    name: 'Bruno',
    emoji: '👨🏾‍🦲',
    gender: 'M',
    skin: 'dark',
    hair: 'bald',
    isCurly: false,
    hasGlasses: true,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'oscar',
    name: 'Oscar',
    emoji: '👴🏿',
    gender: 'M',
    skin: 'dark',
    hair: 'white',
    isCurly: false,
    hasGlasses: true,
    hasHat: false,
    hasBeard: true,
  },
  {
    id: 'aisha',
    name: 'Aisha',
    emoji: '👩🏾‍🦱',
    gender: 'F',
    skin: 'dark',
    hair: 'dark',
    isCurly: true,
    hasGlasses: true,
    hasHat: false,
    hasBeard: false,
  },
  {
    id: 'fatima',
    name: 'Fatima',
    emoji: '🧕🏾',
    gender: 'F',
    skin: 'dark',
    hair: 'dark',
    isCurly: false,
    hasGlasses: false,
    hasHat: true,
    hasBeard: false,
  },
  {
    id: 'rosa',
    name: 'Rosa',
    emoji: '👵🏿',
    gender: 'F',
    skin: 'dark',
    hair: 'white',
    isCurly: false,
    hasGlasses: false,
    hasHat: true,
    hasBeard: false,
  },
  {
    id: 'nina',
    name: 'Nina',
    emoji: '👩🏿‍🦲',
    gender: 'F',
    skin: 'dark',
    hair: 'bald',
    isCurly: false,
    hasGlasses: false,
    hasHat: false,
    hasBeard: false,
  },
];

export function getCharactersForDifficulty(difficulty: Difficulty): Character[] {
  if (difficulty === 'easy') {
    // 12 characters: 6 M, 6 F, exactly 4 light, 4 medium, 4 dark
    const easyIds = [
      'leo', 'marco', 'pietro', 'sofia', 'giulia', 'chiara',
      'samuele', 'davide', 'chloe', 'elena',
      'dario', 'malik', 'aisha', 'fatima'
    ].slice(0, 12);
    return ALL_CHARACTERS.filter((c) => easyIds.includes(c.id));
  }
  if (difficulty === 'medium') {
    // 18 characters: 9 M, 9 F, exactly 6 light, 6 medium, 6 dark
    const mediumIds = [
      'leo', 'marco', 'pietro', 'matteo', 'sofia', 'giulia',
      'samuele', 'luca', 'tarek', 'chloe', 'elena', 'maya',
      'dario', 'malik', 'oscar', 'aisha', 'fatima', 'rosa'
    ];
    return ALL_CHARACTERS.filter((c) => mediumIds.includes(c.id));
  }
  // Hard: all 24 characters (like original classic board)
  return ALL_CHARACTERS;
}

export const QUESTIONS: Question[] = [
  // Genere
  {
    id: 'isFemale',
    text: 'È una donna o ragazza?',
    category: 'Genere',
    categoryIcon: '👩',
    check: (c) => c.gender === 'F',
    minDifficulty: 'easy',
  },
  {
    id: 'isMale',
    text: 'È un uomo o ragazzo?',
    category: 'Genere',
    categoryIcon: '👨',
    check: (c) => c.gender === 'M',
    minDifficulty: 'easy',
  },

  // Carnagione
  {
    id: 'skin_light',
    text: 'Ha la carnagione chiara?',
    category: 'Carnagione',
    categoryIcon: '🏻',
    check: (c) => c.skin === 'light',
    minDifficulty: 'easy',
  },
  {
    id: 'skin_dark',
    text: 'Ha la carnagione scura?',
    category: 'Carnagione',
    categoryIcon: '🏿',
    check: (c) => c.skin === 'dark',
    minDifficulty: 'easy',
  },
  {
    id: 'skin_medium',
    text: 'Ha la carnagione media / dorata?',
    category: 'Carnagione',
    categoryIcon: '🏽',
    check: (c) => c.skin === 'medium',
    minDifficulty: 'medium',
  },

  // Capelli
  {
    id: 'hair_dark',
    text: 'Ha i capelli scuri o neri?',
    category: 'Capelli',
    categoryIcon: '💇',
    check: (c) => c.hair === 'dark',
    minDifficulty: 'easy',
  },
  {
    id: 'hair_blond',
    text: 'Ha i capelli biondi?',
    category: 'Capelli',
    categoryIcon: '👱',
    check: (c) => c.hair === 'blond',
    minDifficulty: 'medium',
  },
  {
    id: 'hair_red',
    text: 'Ha i capelli rossi?',
    category: 'Capelli',
    categoryIcon: '🧑‍🦰',
    check: (c) => c.hair === 'red',
    minDifficulty: 'medium',
  },
  {
    id: 'hair_white',
    text: 'Ha i capelli bianchi o grigi?',
    category: 'Capelli',
    categoryIcon: '🧑‍🦳',
    check: (c) => c.hair === 'white',
    minDifficulty: 'medium',
  },
  {
    id: 'hair_bald',
    text: 'È calvo o senza capelli visibili?',
    category: 'Capelli',
    categoryIcon: '🧑‍🦲',
    check: (c) => c.hair === 'bald',
    minDifficulty: 'hard',
  },
  {
    id: 'isCurly',
    text: 'Ha i capelli ricci?',
    category: 'Capelli',
    categoryIcon: '🌀',
    check: (c) => c.isCurly,
    minDifficulty: 'hard',
  },

  // Dettagli / Accessori
  {
    id: 'hasGlasses',
    text: 'Porta gli occhiali?',
    category: 'Dettagli',
    categoryIcon: '👓',
    check: (c) => c.hasGlasses,
    minDifficulty: 'easy',
  },
  {
    id: 'hasHat',
    text: 'Indossa un cappello o copricapo?',
    category: 'Dettagli',
    categoryIcon: '🧢',
    check: (c) => c.hasHat,
    minDifficulty: 'easy',
  },
  {
    id: 'hasBeard',
    text: 'Ha la barba?',
    category: 'Dettagli',
    categoryIcon: '🧔',
    check: (c) => c.hasBeard,
    minDifficulty: 'easy',
  },
];

export function getQuestionsForDifficulty(difficulty: Difficulty): Question[] {
  if (difficulty === 'easy') {
    return QUESTIONS.filter((q) => q.minDifficulty === 'easy');
  }
  if (difficulty === 'medium') {
    return QUESTIONS.filter((q) => q.minDifficulty === 'easy' || q.minDifficulty === 'medium');
  }
  return QUESTIONS;
}
