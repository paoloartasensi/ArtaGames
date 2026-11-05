/**
 * More forgiving taps on touch screens (especially old iPads / small hands).
 *
 * Safari drops the click when the finger moves a few pixels while pressing, and iOS 9
 * also delays clicks. For <button>s we turn a touch that starts and ends on the same
 * button, moving less than TAP_TOLERANCE px, into an immediate click. The native click is
 * cancelled (preventDefault on touchend) so it never fires twice.
 */
const TAP_TOLERANCE = 24; // px the finger may wander and still count as a tap
const MAX_PRESS_MS = 1500; // longer presses are ignored (not a tap)

interface TapStart {
  x: number;
  y: number;
  time: number;
  button: HTMLButtonElement;
}

function buttonFrom(target: EventTarget | null): HTMLButtonElement | null {
  const el = target as Element | null;
  if (!el || typeof el.closest !== 'function') return null;
  return el.closest('button') as HTMLButtonElement | null;
}

export function installTapShim() {
  if (typeof window === 'undefined' || !('ontouchstart' in window)) return;

  let start: TapStart | null = null;

  window.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      start = null;
      if (e.touches.length !== 1) return;
      const button = buttonFrom(e.target);
      if (!button || button.disabled) return;
      const t = e.touches[0];
      start = { x: t.clientX, y: t.clientY, time: Date.now(), button };
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0];
      if (!t) return;
      if (Math.abs(t.clientX - start.x) > TAP_TOLERANCE || Math.abs(t.clientY - start.y) > TAP_TOLERANCE) {
        start = null; // it's a drag / scroll, not a tap
      }
    },
    { passive: true }
  );

  window.addEventListener('touchcancel', () => {
    start = null;
  });

  window.addEventListener(
    'touchend',
    (e: TouchEvent) => {
      const s = start;
      start = null;
      if (!s || e.touches.length > 0) return;
      const t = e.changedTouches[0];
      if (!t) return;
      if (Math.abs(t.clientX - s.x) > TAP_TOLERANCE || Math.abs(t.clientY - s.y) > TAP_TOLERANCE) return;
      if (Date.now() - s.time > MAX_PRESS_MS) return;
      if (s.button.disabled || !document.body.contains(s.button)) return;

      // Fire the click now and suppress the browser's own (possibly lost or delayed) click
      e.preventDefault();
      s.button.click();
    },
    { passive: false }
  );
}
