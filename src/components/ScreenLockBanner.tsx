import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Maximize2, Minimize2, Eye } from 'lucide-react';
import { screenShield, ScreenLockState } from '../utils/screenLock';
import { useTheme } from '../theme/themeContext';

export const ScreenLockBanner: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [shieldState, setShieldState] = useState<ScreenLockState>(screenShield.getState());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    return screenShield.subscribe((state) => {
      setShieldState(state);
    });
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const handleToggleShield = () => {
    const active = screenShield.toggleGestureShield();
    triggerToast(active ? 'Blocco Gesti ATTIVO: swipe e refresh disabilitati!' : 'Blocco Gesti DISATTIVATO');
  };

  const handleToggleFullscreen = async () => {
    const isFull = await screenShield.toggleFullscreen();
    triggerToast(isFull ? 'Schermo Intero ATTIVO' : 'Schermo Intero DISATTIVATO');
  };

  const handleToggleWakeLock = async () => {
    const isWake = await screenShield.toggleWakeLock();
    triggerToast(isWake ? 'Schermo sempre acceso: non si spegnerà durante il gioco' : 'Standby standard ripristinato');
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-slate-700/30 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Floating Mini Controls for Tablet / Mobile */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10 backdrop-blur-md border border-white/10 text-xs">
        {/* Gesture Shield Button */}
        <button
          onClick={handleToggleShield}
          title={shieldState.isGestureShieldActive ? 'Blocco swipe attivo (protegge da uscite involontarie)' : 'Attiva blocco swipe'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all min-h-[36px] ${
            shieldState.isGestureShieldActive
              ? 'bg-emerald-600 text-white shadow-sm'
              : isDark
              ? 'bg-slate-800/80 text-slate-300 hover:text-white'
              : 'bg-white/80 text-stone-700 hover:text-black'
          }`}
        >
          {shieldState.isGestureShieldActive ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden sm:inline">
            {shieldState.isGestureShieldActive ? 'Swipe Bloccato' : 'Blocca Swipe'}
          </span>
        </button>

        {/* Wake Lock Screen Awake */}
        <button
          onClick={handleToggleWakeLock}
          title={shieldState.isWakeLocked ? 'Schermo Sempre Acceso ATTIVO' : 'Mantieni Schermo Acceso'}
          className={`p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
            shieldState.isWakeLocked
              ? 'bg-amber-600 text-white'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-stone-600 hover:text-black'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={handleToggleFullscreen}
          title="Schermo Intero"
          className={`p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-black'
          }`}
        >
          {shieldState.isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
};
