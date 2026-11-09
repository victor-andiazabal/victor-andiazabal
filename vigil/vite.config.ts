import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Set VIGIL_BASE when deploying under a sub-path (GitHub Pages project site).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Space Vigil, crew health self-assessed',
        short_name: 'Space Vigil',
        description: 'Astronaut health self-assessment and decision support for long-duration missions.',
        theme_color: '#0b0f14',
        background_color: '#0b0f14',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    }),
  ],
  base: process.env.VIGIL_BASE ?? '/',
});
