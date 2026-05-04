import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://101.47.12.178:18888',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://101.47.12.178:18888',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
