import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));

export default defineConfig(() => {
  const isElectronBuild = process.env.VITE_ELECTRON === '1';

  return {
    base: isElectronBuild ? './' : '/',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version || '1.2.0'),
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(!isElectronBuild
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: [
                'favicon.png',
                'apple-touch-icon.png',
                'pwa-192x192.png',
                'pwa-512x512.png',
                'pwa-maskable-512x512.png',
                'version.json',
                'assets/aistudio/logo_f7cf1eaa.png',
              ],
        manifest: {
          id: '/',
          name: 'КинезиоАтлас — Атлас ММТ и остеопатии',
          short_name: 'КинезиоАтлас',
          description:
            'Офлайн клинический атлас ММТ, миофасциальных цепей, акупунктурных точек, опросника Триады здоровья и базы пациентов.',
          theme_color: '#1d4ed8',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          lang: 'ru',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,woff,woff2}'],
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
        ]
      : [
          {
            name: 'electron-pwa-noop',
            resolveId(id: string) {
              if (id === 'virtual:pwa-register') return '\0virtual:pwa-register';
              return null;
            },
            load(id: string) {
              if (id === '\0virtual:pwa-register') {
                return 'export function registerSW() { return function noop() {}; }';
              }
              return null;
            },
          },
        ]),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
    },
  };
});
