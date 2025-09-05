import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // 분석을 원할 때만 visualizer를 활성화합니다. 실행 예: ANALYZE=true npm run build
    ...(((globalThis?.process?.env?.ANALYZE === 'true') || (import.meta.env && import.meta.env.ANALYZE === 'true'))
      ? [visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true })]
      : [])
  ],
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
        // manualChunks를 함수형으로 바꿔 대형 서드파티 라이브러리를 분리
        // 목표: d3, 마크다운 관련, react 계열을 각각 별도 청크로 분리하여
        // GraphPage 번들에서 무거운 모듈을 떼어냅니다.
        manualChunks(id) {
          if (!id) return null

          // 1) node_modules 분리 (대형 서드파티 라이브러리)
          if (id.includes('node_modules')) {
            if (id.includes(`${path.sep}d3${path.sep}`) || id.includes(`${path.sep}d3-`)) return 'd3'
            if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('unist-util-visit')) return 'markdown'
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor'
            return 'vendor'
          }

          // 2) 앱 레벨의 큰 컴포넌트/페이지를 명시적으로 분리
          // 경로 기반으로 명명된 청크를 생성하면 런타임에서 재사용/캐시 이점이 큽니다.
          if (id.includes(`${path.sep}src${path.sep}components${path.sep}GraphView`)) return 'graph-view'
          if (id.includes(`${path.sep}src${path.sep}components${path.sep}GraphModal`)) return 'graph-modal'
          if (id.includes(`${path.sep}src${path.sep}components${path.sep}InsightDrawer`)) return 'insight-drawer'
          if (id.includes(`${path.sep}src${path.sep}pages${path.sep}GraphPage`)) return 'graph-page'

          // 기본 동작
          return null
        }
      }
    }
  }
}))
