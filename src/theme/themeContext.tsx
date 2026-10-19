import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ThemeConfig } from '../types/game';

export const THEMES: Record<ThemeId, ThemeConfig> = {
  wood: {
    id: 'wood',
    name: 'Zen Wood',
    description: 'Tavolo in legno tradizionale kaya e bambù',
    bgMain: 'bg-[#1c1917]',
    bgSurface: 'bg-[#292524]',
    bgCard: 'bg-[#3b322c]',
    textPrimary: 'text-[#f5f5f4]',
    textSecondary: 'text-[#d6d3d1]',
    textMuted: 'text-[#a8a29e]',
    borderSubtle: 'border-[#443831]',
    accent: 'bg-[#c29b38]',
    accentHover: 'hover:bg-[#d4ab44]',
    boardBg: '#dcb35c',
    boardGrid: '#452b14',
    cellLight: '#eed8a1',
    cellDark: '#b8863b',
    pieceLight: '#fdfbf7',
    pieceDark: '#1c1917',
    highlightMove: 'rgba(217, 119, 6, 0.45)',
  },
  slate: {
    id: 'slate',
    name: 'Nordic Slate',
    description: 'Design minimale moderno e grafite nordica',
    bgMain: 'bg-[#0f172a]',
    bgSurface: 'bg-[#1e293b]',
    bgCard: 'bg-[#334155]',
    textPrimary: 'text-[#f8fafc]',
    textSecondary: 'text-[#cbd5e1]',
    textMuted: 'text-[#94a3b8]',
    borderSubtle: 'border-[#334155]',
    accent: 'bg-[#38bdf8]',
    accentHover: 'hover:bg-[#0284c7]',
    boardBg: '#1e293b',
    boardGrid: '#475569',
    cellLight: '#334155',
    cellDark: '#1e293b',
    pieceLight: '#f8fafc',
    pieceDark: '#090d16',
    highlightMove: 'rgba(56, 189, 248, 0.4)',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight OLED',
    description: 'Nero profondo a massimo contrasto',
    bgMain: 'bg-[#09090b]',
    bgSurface: 'bg-[#18181b]',
    bgCard: 'bg-[#27272a]',
    textPrimary: 'text-[#fafafa]',
    textSecondary: 'text-[#d4d4d8]',
    textMuted: 'text-[#71717a]',
    borderSubtle: 'border-[#27272a]',
    accent: 'bg-[#6366f1]',
    accentHover: 'hover:bg-[#4f46e5]',
    boardBg: '#121215',
    boardGrid: '#3f3f46',
    cellLight: '#27272a',
    cellDark: '#121215',
    pieceLight: '#ffffff',
    pieceDark: '#000000',
    highlightMove: 'rgba(99, 102, 241, 0.45)',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Club',
    description: 'Panno verde classico da club e torneo',
    bgMain: 'bg-[#062c22]',
    bgSurface: 'bg-[#083c2e]',
    bgCard: 'bg-[#0d4f3e]',
    textPrimary: 'text-[#ecfdf5]',
    textSecondary: 'text-[#a7f3d0]',
    textMuted: 'text-[#6ee7b7]',
    borderSubtle: 'border-[#135d49]',
    accent: 'bg-[#10b981]',
    accentHover: 'hover:bg-[#059669]',
    boardBg: '#0f5132',
    boardGrid: '#042818',
    cellLight: '#d1fae5',
    cellDark: '#065f46',
    pieceLight: '#f0fdf4',
    pieceDark: '#022c22',
    highlightMove: 'rgba(234, 179, 8, 0.45)',
  },
  paper: {
    id: 'paper',
    name: 'Carta Washi',
    description: 'Toni pergamena calda e inchiostro sumi',
    bgMain: 'bg-[#f4efe6]',
    bgSurface: 'bg-[#e8decb]',
    bgCard: 'bg-[#ded2bc]',
    textPrimary: 'text-[#292524]',
    textSecondary: 'text-[#57534e]',
    textMuted: 'text-[#78716c]',
    borderSubtle: 'border-[#cfc3ad]',
    accent: 'bg-[#854d0e]',
    accentHover: 'hover:bg-[#713f12]',
    boardBg: '#e6dbbe',
    boardGrid: '#524336',
    cellLight: '#f5edd6',
    cellDark: '#c7b48e',
    pieceLight: '#ffffff',
    pieceDark: '#292524',
    highlightMove: 'rgba(180, 83, 9, 0.35)',
  },
};

interface ThemeContextType {
  theme: ThemeConfig;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('tabletop_theme');
    if (saved && saved in THEMES) {
      return saved as ThemeId;
    }
    return 'wood';
  });

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    localStorage.setItem('tabletop_theme', id);
  };

  const theme = THEMES[themeId] || THEMES.wood;
  const isDark = themeId !== 'paper';

  useEffect(() => {
    // Sync theme-color meta tag
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      if (themeId === 'wood') metaTheme.setAttribute('content', '#1c1917');
      else if (themeId === 'slate') metaTheme.setAttribute('content', '#0f172a');
      else if (themeId === 'midnight') metaTheme.setAttribute('content', '#09090b');
      else if (themeId === 'emerald') metaTheme.setAttribute('content', '#062c22');
      else if (themeId === 'paper') metaTheme.setAttribute('content', '#f4efe6');
    }
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, isDark }}>
      <div className={`min-h-screen transition-colors duration-200 ${theme.bgMain} ${theme.textPrimary}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
