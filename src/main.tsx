/**
 * src/main.tsx
 * 책임: 앱 루트 진입점 (React 렌더링 초기화)
 * 주요 역할: React.StrictMode로 App을 마운트
 * 한글 설명: Vite 환경 변수에 따라 basename을 처리하지 않습니다(앱 레벨에서 처리).
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
