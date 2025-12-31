import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
function getPagesBasePath(): string {
  const explicit = process.env.BASE_PATH;
  if (explicit) return explicit.endsWith('/') ? explicit : `${explicit}/`;

  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  return repo ? `/${repo}/` : '/';
}

export default defineConfig(({ command }) => {
  const base = command === 'build' ? getPagesBasePath() : '/';

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'The Resistance Game Helper',
          short_name: 'Resistance',
          description: 'Offline helper app for The Resistance board game',
          theme_color: '#070a13',
          background_color: '#070a13',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '.',
          scope: '.',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        },
      }),
    ],
  };
});
