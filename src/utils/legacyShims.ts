/**
 * Shim per browser datati (Safari 9 / iOS 9.3.5) che non supportano `aspect-ratio`.
 * Imposta l'altezza in pixel degli elementi `aspect-square` / `aspect-[w/h]` in base
 * alla loro larghezza. Sui browser moderni non fa nulla.
 */
function supportsAspectRatio(): boolean {
  try {
    return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('aspect-ratio', '1 / 1');
  } catch {
    return false;
  }
}

function ratioFor(el: HTMLElement): number | null {
  const cls = typeof el.className === 'string' ? el.className : '';
  if (/(^|\s)aspect-square(\s|$)/.test(cls)) return 1;
  const m = cls.match(/(?:^|\s)aspect-\[(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\]/);
  if (m) return parseFloat(m[2]) / parseFloat(m[1]);
  return null;
}

function applyAll() {
  const nodes = document.querySelectorAll('[class*="aspect-"]');
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i] as HTMLElement;
    const ratio = ratioFor(el);
    if (ratio === null) continue;
    const w = el.offsetWidth;
    if (w > 0) {
      const h = Math.round(w * ratio) + 'px';
      if (el.style.height !== h) el.style.height = h;
    }
  }
}

export function installLegacyShims() {
  if (typeof window === 'undefined' || supportsAspectRatio()) return;

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      applyAll();
    });
  };

  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', () => setTimeout(schedule, 250));
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }
  schedule();
}
