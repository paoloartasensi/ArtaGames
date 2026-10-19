export type GameType = 'go' | 'checkers' | 'chess' | 'battleship' | 'connect4';

export type PlayMode = 'bot' | 'local_pvp';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';

export type ThemeId = 'wood' | 'slate' | 'midnight' | 'emerald' | 'paper';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  bgMain: string;
  bgSurface: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  accent: string;
  accentHover: string;
  boardBg: string;
  boardGrid: string;
  cellLight: string;
  cellDark: string;
  pieceLight: string;
  pieceDark: string;
  highlightMove: string;
}

export interface GameOption {
  id: GameType;
  name: string;
  subtitle: string;
  players: string;
  estTime: string;
  description: string;
}
