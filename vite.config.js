import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/PargameBlog/' : '/', // 개발환경에서는 루트 경로
  resolve: {
    alias: {
  '@': path.resolve(__dirname, 'src'),
    },
  },
}))
