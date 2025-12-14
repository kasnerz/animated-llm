import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: Now using organization domain (animatedllm.github.io) instead of /animated-llm/ subdirectory
// For custom domains on GitHub Pages, base should be '/' in all modes
// For development, use '/' to avoid trailing slash issues

// https://vite.dev/config/
export default defineConfig(() => ({
  base: '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8899,
  },
}));
