import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

function fixLegacySafariSystemPlugin() {
  return {
    name: 'fix-legacy-safari-system',
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      return html.replace(
        /System\.import\(document\.getElementById\(['"]vite-legacy-entry['"]\)\.getAttribute\(['"]data-src['"]\)\)/g,
        `(function runLegacy(){if(window.__legacy_loaded)return;if(typeof System!=='undefined'&&System&&System.import){window.__legacy_loaded=true;System.import(document.getElementById('vite-legacy-entry').getAttribute('data-src'));}else{setTimeout(runLegacy,25);}})()`
      );
    },
  };
}

// Il chunk dei polyfill legacy viene costruito da plugin-legacy con rolldown, il cui
// runtime CommonJS usa arrow function: Safari 9 (iPad datati, iOS 9) va in SyntaxError
// e di conseguenza SystemJS non viene mai definito. Lo ritraspiliamo in ES5.
const LEGACY_TARGETS = ['defaults', 'not IE 11', 'ios_saf >= 9', 'safari >= 9'];

function transpileLegacyPolyfillsPlugin() {
  return {
    name: 'transpile-legacy-polyfills',
    enforce: 'post' as const,
    apply: 'build' as const,
    async generateBundle(_opts: unknown, bundle: Record<string, any>) {
      const { transformAsync } = await import('@babel/core');
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk' || !/polyfills-legacy/.test(file.fileName)) continue;
        const result = await transformAsync(file.code, {
          babelrc: false,
          configFile: false,
          sourceType: 'script',
          compact: true,
          minified: true,
          comments: false,
          presets: [['@babel/preset-env', { targets: LEGACY_TARGETS, modules: false, useBuiltIns: false }]],
        });
        if (result?.code) file.code = result.code;
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/ArtaGames/',
    build: {
      minify: 'terser' as const,
      terserOptions: {
        safari10: true,
      },
    },
    plugins: [
      react(),
      legacy({
        targets: LEGACY_TARGETS,
      }),
      fixLegacySafariSystemPlugin(),
      transpileLegacyPolyfillsPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          id: '/ArtaGames/',
          name: 'ArtaGames · Giochi da Tavolo 1vs1',
          short_name: 'ArtaGames',
          description: 'Piattaforma minimale per giochi da tavolo 1vs1 (Go, Dama, Scacchi, Battaglia Navale, Forza 4) per bambini e ragazzi contro BOT o 1vs1 locale, giocabile offline.',
          theme_color: '#1c1917',
          background_color: '#1c1917',
          display: 'fullscreen',
          display_override: ['fullscreen', 'standalone'],
          start_url: '/ArtaGames/',
          scope: '/ArtaGames/',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
