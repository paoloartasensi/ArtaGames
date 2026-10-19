import React from 'react';
import { useTheme } from '../theme/themeContext';
import { ScreenLockBanner } from './ScreenLockBanner';
import { PWAInstallButton } from './PWAInstallButton';
import { Palette, HelpCircle, LayoutGrid, Gamepad2 } from 'lucide-react';
import { GameId, GAME_REGISTRY } from '../games/registry';

interface HeaderProps {
  activeGameId: GameId;
  viewMode: 'catalog' | 'game';
  onGoToCatalog: () => void;
  onOpenRules: () => void;
  onOpenTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeGameId,
  viewMode,
  onGoToCatalog,
  onOpenRules,
  onOpenTheme,
}) => {
  const { theme, isDark } = useTheme();
  const activeGame = GAME_REGISTRY[activeGameId];

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-black/10'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={onGoToCatalog}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
        >
          <Gamepad2 className="w-5 h-5 text-amber-500" />
          <span>ArtaGames</span>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={onGoToCatalog}
            className={`hover:text-amber-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              viewMode === 'catalog' ? 'text-amber-500 font-bold' : ''
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Catalogo Giochi</span>
          </button>

          <button
            onClick={onOpenRules}
            className="hover:text-amber-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Regole</span>
          </button>

          <button
            onClick={onOpenTheme}
            className="hover:text-amber-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Temi</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action / Screen lock toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />
          <ScreenLockBanner />
        </div>
      </div>
    </header>
  );
};
