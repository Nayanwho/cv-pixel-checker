import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for deployment flexibility (Netlify, subdirectories, local static viewing)
  server: {
    port: 3005,
    host: true
  },
  build: {
    rollupOptions: {
      external: ['module', 'path', '@napi-rs/canvas']
    }
  }
})
