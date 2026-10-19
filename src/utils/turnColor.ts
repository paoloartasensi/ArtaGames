import { PlayMode } from '../types/game';

// Soft, kid-friendly turn-indicator colours (pastel so the board stays readable).
export const TURN_COLORS = {
  player1: '#93c5fd', // soft blue  (Giocatore 1 / Tu)
  player2: '#fca5a5', // soft red   (Giocatore 2, in 2 giocatori)
  bot: '#fcd34d', // soft yellow (BOT)
} as const;

/**
 * Blue = Giocatore 1, Red = Giocatore 2 (PvP), Yellow = BOT.
 * `playerIndex` is 0 for the first player / human, 1 for the opponent.
 */
export function getTurnColor(playerIndex: 0 | 1, playMode: PlayMode): string {
  if (playerIndex === 0) return TURN_COLORS.player1;
  return playMode === 'bot' ? TURN_COLORS.bot : TURN_COLORS.player2;
}
