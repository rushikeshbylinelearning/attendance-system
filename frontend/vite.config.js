import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // ✅ Correct backend port
        changeOrigin: true,
        secure: false, // Optional: avoid SSL issues during development
      }
    }
  }
});
// http://localhost:3001
// https://attendance.bylinelms.com