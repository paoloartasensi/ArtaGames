import type React from 'react';
/**
 * True on browsers without CSS grid (Safari <= 10.0, e.g. iPad on iOS 9.3.5).
 * There `.grid` falls back to flex-wrap (see index.css), so cells of boards that use
 * inline `gridTemplateColumns` need an explicit size to wrap into the right rows.
 */
export const NO_CSS_GRID: boolean = (() => {
  try {
    return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && !CSS.supports('display', 'grid');
  } catch {
    return false;
  }
})();

/** Inline size for one cell of a cols x rows board, only when CSS grid is missing. */
export function legacyCellStyle(cols: number, rows?: number): React.CSSProperties | undefined {
  if (!NO_CSS_GRID) return undefined;
  return rows ? { width: `${100 / cols}%`, height: `${100 / rows}%` } : { width: `${100 / cols}%` };
}
