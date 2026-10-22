/**
 * Screen Lock & Gesture Shield System
 * Prevents mobile/tablet accidental swipes, edge navigation, pull-to-refresh,
 * screen dimming/sleeping (WakeLock API), and enables full immersive fullscreen.
 */

export interface ScreenLockState {
  isGestureShieldActive: boolean;
  isFullscreen: boolean;
  isWakeLocked: boolean;
}

type Listener = (state: ScreenLockState) => void;

class ScreenShieldService {
  private gestureShieldActive = true;
  private isFullscreen = false;
  private wakeLockSentinel: unknown = null;
  private listeners: Set<Listener> = new Set();
  private touchMoveHandler: ((e: TouchEvent) => void) | null = null;
  private autoWakeLockRequested = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize gesture shield by default for seamless game experience
      this.setupGestureShield();
      this.setupAutoWakeLock();

      // Prevent native context menu (Copia, Seleziona tutto, Condividi) on long press / drag
      window.addEventListener(
        'contextmenu',
        (e) => {
          e.preventDefault();
          return false;
        },
        { passive: false }
      );

      // Prevent native text selection start on touch/drag
      window.addEventListener(
        'selectstart',
        (e) => {
          e.preventDefault();
          return false;
        },
        { passive: false }
      );

      // Immediately cancel any accidental selection
      document.addEventListener('selectionchange', () => {
        try {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            sel.removeAllRanges();
          }
        } catch {}
      });

      document.addEventListener('fullscreenchange', () => {
        this.isFullscreen = !!document.fullscreenElement;
        this.notify();
      });

      // Handle visibility change to re-acquire wake lock if page was backgrounded
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.wakeLockSentinel) {
          this.requestWakeLock();
        }
      });
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): ScreenLockState {
    return {
      isGestureShieldActive: this.gestureShieldActive,
      isFullscreen: this.isFullscreen,
      isWakeLocked: this.wakeLockSentinel !== null,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  /**
   * Prevents swipe-to-go-back, edge-drag, and pull-to-refresh
   */
  public setupGestureShield() {
    if (typeof window === 'undefined') return;

    if (!this.touchMoveHandler) {
      this.touchMoveHandler = (e: TouchEvent) => {
        if (!this.gestureShieldActive) return;

        // Prevent pinch zoom with 2+ fingers
        if (e.touches.length > 1) {
          e.preventDefault();
          return;
        }

        const touch = e.touches[0];
        if (!touch) return;

        // Edge swipe detection (left 25px or right 25px triggers iOS/Android history back/forward)
        const isNearEdge = touch.clientX < 28 || touch.clientX > window.innerWidth - 28;
        if (isNearEdge) {
          e.preventDefault();
          return;
        }

        // Check if event target or ancestor allows scrolling
        let target = e.target as HTMLElement | null;
        let isInsideScrollable = false;
        while (target && target !== document.body) {
          if (target.classList?.contains('allow-scroll') || target.getAttribute?.('data-scrollable') === 'true') {
            isInsideScrollable = true;
            break;
          }
          target = target.parentElement;
        }

        // If touch is on game board or outside scrollable containers, block default dragging/pulling
        if (!isInsideScrollable) {
          // If on a game canvas/board, block to prevent bounce
          const onBoard = (e.target as HTMLElement)?.closest('.game-board-container');
          if (onBoard) {
            e.preventDefault();
          }
        }
      };

      window.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    }
  }

  /**
   * Auto-acquire the screen wake lock on the first user interaction,
   * so the screen stays on during play (restaurant-menu / kiosk feel).
   * Wake Lock requires a user gesture, hence the one-time listeners.
   */
  private setupAutoWakeLock() {
    if (typeof window === 'undefined') return;

    const tryAcquire = () => {
      if (this.autoWakeLockRequested) return;
      this.autoWakeLockRequested = true;
      this.requestWakeLock();
    };

    ['pointerdown', 'touchstart', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, tryAcquire, { once: true, passive: true });
    });
  }

  public toggleGestureShield(): boolean {
    this.gestureShieldActive = !this.gestureShieldActive;
    if (this.gestureShieldActive) {
      document.body.classList.add('touch-locked');
    } else {
      document.body.classList.remove('touch-locked');
    }
    this.notify();
    return this.gestureShieldActive;
  }

  public async toggleFullscreen(): Promise<boolean> {
    if (typeof document === 'undefined') return false;

    try {
      if (!document.fullscreenElement) {
        const root = document.documentElement as unknown as {
          requestFullscreen?: () => Promise<void>;
          webkitRequestFullscreen?: () => Promise<void>;
        };
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if (root.webkitRequestFullscreen) {
          await root.webkitRequestFullscreen();
        }
        this.isFullscreen = true;
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        this.isFullscreen = false;
      }
    } catch {
      // Fallback or user gesture rejection
    }

    this.notify();
    return this.isFullscreen;
  }

  public async toggleWakeLock(): Promise<boolean> {
    if (this.wakeLockSentinel) {
      this.releaseWakeLock();
      return false;
    } else {
      return await this.requestWakeLock();
    }
  }

  private async requestWakeLock(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } };
        this.wakeLockSentinel = await nav.wakeLock.request('screen');
        this.notify();
        return true;
      } catch {
        this.wakeLockSentinel = null;
        this.notify();
        return false;
      }
    }
    return false;
  }

  private releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        const sentinel = this.wakeLockSentinel as { release?: () => Promise<void> };
        if (sentinel.release) {
          sentinel.release();
        }
      } catch {}
      this.wakeLockSentinel = null;
      this.notify();
    }
  }
}

export const screenShield = new ScreenShieldService();
