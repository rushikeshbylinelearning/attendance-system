// frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is the proxy configuration
    proxy: {
      // Any request starting with /api will be proxied
      '/api': {
        // The target is your backend server
        target: 'http://localhost:3001',
        // This is important for changing the origin of the request
        changeOrigin: true,
        // You can optionally rewrite the path, but we don't need to here
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})