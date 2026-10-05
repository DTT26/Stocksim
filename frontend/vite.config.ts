import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // AI inspect route → Python service directly
      '/api/ai/inspect-chart-data': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: () => '/internal/ai/inspect-drawings',
      },
      // All other /api calls → Node backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})

