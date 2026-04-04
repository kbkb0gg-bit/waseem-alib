import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'admin',
  plugins: [react()],
  build: {
    outDir: '../dist/admin',
    emptyOutDir: true,
  },
  server: {
    port: 3001, // Admin can run on a different port during dev if needed, but only 3000 is exposed
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});
