import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: Set base to repository name for GitHub Pages project deployment
// Without this, built asset URLs will be root-relative (/) and 404 under /animated-llm/
// For development, use '/' to avoid trailing slash issues

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/animated-llm/' : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8899,
  },
}));
