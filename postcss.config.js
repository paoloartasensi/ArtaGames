/**
 * Safari 9 (iOS 9.3.5) compatibility for the CSS Tailwind 3 generates:
 * - gradient stops use `var(--tw-gradient-*-position)` whose value is empty → the whole
 *   gradient is dropped by old WebKit, so cards/tiles lose their color;
 * - 4-digit hex `#0000` (shadows/rings) is not understood before Safari 10;
 * - space-separated `rgb(r g b / a)` is not understood before Safari 12.1.
 */
const legacySafariCss = () => ({
  postcssPlugin: 'legacy-safari-css',
  Declaration(decl) {
    let v = decl.value;
    const before = v;
    v = v.replace(/\s*var\(--tw-gradient-(?:from|via|to)-position\)/g, '');
    v = v.replace(/#0000(?![0-9a-fA-F])/g, 'rgba(0,0,0,0)');
    v = v.replace(/rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*([^)]+)\)/g, 'rgba($1,$2,$3,$4)');
    v = v.replace(/rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\)/g, 'rgb($1,$2,$3)');
    if (v !== before) decl.value = v;
  },
});
legacySafariCss.postcss = true;

/**
 * Old WebKit (Safari 9) can't resolve Tailwind's nested gradient variables
 * (`linear-gradient(..., var(--tw-gradient-stops))`), so gradient backgrounds vanish.
 * For browsers without CSS grid (Safari <= 10.0) give every `from-*` class a solid
 * background-color fallback equal to its start color.
 */
const legacyGradientFallback = (postcss) => ({
  postcssPlugin: 'legacy-gradient-fallback',
  OnceExit(root) {
    const fallbacks = [];
    root.walkRules((rule) => {
      if (rule.parent && rule.parent.type === 'atrule') return; // skip responsive/hover variants
      rule.each((d) => {
        if (d.type === 'decl' && d.prop === '--tw-gradient-from') {
          const color = d.value.trim();
          // Solid hex colors only: rgba/transparent starts are overlays, not backgrounds
          if (/^#[0-9a-fA-F]{3,8}$/.test(color)) {
            fallbacks.push(postcss.rule({ selector: rule.selector }).append({ prop: 'background-color', value: color }));
          }
        }
      });
    });
    if (fallbacks.length) {
      root.append(postcss.atRule({ name: 'supports', params: 'not (display: grid)' }).append(fallbacks));
    }
  },
});
legacyGradientFallback.postcss = true;

export default {
  plugins: [
    (await import('tailwindcss')).default(),
    legacySafariCss(),
    legacyGradientFallback((await import('postcss')).default),
    (await import('autoprefixer')).default({
      overrideBrowserslist: ['defaults', 'not IE 11', 'ios_saf >= 9', 'safari >= 9'],
    }),
  ],
};
