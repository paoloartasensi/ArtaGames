import React, { useState } from 'react';
import { useTheme } from '../theme/themeContext';
import { ScreenLockBanner } from './ScreenLockBanner';
import { PWAInstallButton } from './PWAInstallButton';
import { Palette, HelpCircle, LayoutGrid, Gamepad2, RotateCw } from 'lucide-react';
import { GameId, GAME_REGISTRY } from '../games/registry';
import { clearCacheAndReload } from '../utils/cacheManager';

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
  const [isReloading, setIsReloading] = useState(false);
  const activeGame = GAME_REGISTRY[activeGameId];

  const handleReload = async () => {
    setIsReloading(true);
    await clearCacheAndReload();
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-black/10'
      }`}
    >
      <div className="max-w-6xl mx-auto px-2 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-6 min-w-0">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={onGoToCatalog}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
        >
          <Gamepad2 className="w-5 h-5 text-amber-500" />
          <span className="hidden sm:inline">ArtaGames</span>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="flex items-center gap-1 sm:gap-4 min-w-0 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={onGoToCatalog}
            className={`hover:text-amber-500 transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 min-w-[40px] min-h-[40px] ${
              viewMode === 'catalog' ? 'text-amber-500 font-bold' : ''
            }`}
          >
            <LayoutGrid className="w-5 h-5 lg:w-4 lg:h-4" />
            <span className="hidden lg:inline">Catalogo Giochi</span>
          </button>

          <button
            onClick={onOpenRules}
            className="hover:text-amber-500 transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 min-w-[40px] min-h-[40px]"
          >
            <HelpCircle className="w-5 h-5 lg:w-4 lg:h-4" />
            <span className="hidden lg:inline">Regole</span>
          </button>

          <button
            onClick={onOpenTheme}
            className="hover:text-amber-500 transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 min-w-[40px] min-h-[40px]"
          >
            <Palette className="w-5 h-5 lg:w-4 lg:h-4" />
            <span className="hidden lg:inline">Temi</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action / Screen lock toolbar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={handleReload}
            disabled={isReloading}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isReloading
                ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 cursor-wait'
                : 'bg-black/5 dark:bg-white/10 hover:bg-amber-500/15 hover:border-amber-500/40 border-black/5 dark:border-white/10 text-stone-600 dark:text-stone-300'
            }`}
            title="Svuota la cache e aggiorna all'ultima versione"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-amber-500' : ''}`} />
            <span className="hidden md:inline">
              {isReloading ? 'Aggiorno...' : 'Aggiorna'}
            </span>
          </button>
          <PWAInstallButton />
          <ScreenLockBanner />
        </div>
      </div>
    </header>
  );
};
