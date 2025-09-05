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
  // 빌드 시 Rollup 옵션: 분석을 위해 소스맵을 생성하고 React 관련 라이브러리를 별도 청크로 분리
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // 간단한 manualChunks 설정으로 React 관련 라이브러리를 별도 청크로 분리
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
}))
