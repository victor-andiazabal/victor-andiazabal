import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set VIGIL_BASE when deploying under a sub-path (GitHub Pages project site).
export default defineConfig({
  plugins: [react()],
  base: process.env.VIGIL_BASE ?? '/',
});
