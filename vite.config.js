import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      './nodeCanvasLoader.js': path.resolve(__dirname, 'src/engine/browserCanvasLoader.js')
    }
  },
  server: {
    port: 3005,
    host: true
  }
});
