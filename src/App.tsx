/**
 * src/App.tsx
 * 책임: 라우터 및 전역 레이아웃(네비게이션, Footer)을 정의하는 루트 컴포넌트
 * 주요 export: default App (React.FC)
 * 한글 설명: Vite BASE_URL에 따라 Router basename을 동적으로 계산합니다.
 */

import { Suspense, lazy } from 'react'
import { Link, Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Footer from './components/Footer'
const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const GraphPage = lazy(() => import('./pages/GraphPage'))
const PostPage = lazy(() => import('./pages/PostPage'))
import './App.css'

function App() {
  // Vite의 BASE_URL과 동기화 (dev: '/', build: '/PargameBlog/')
  const baseUrl = import.meta.env.BASE_URL || '/'
  let basename = baseUrl
  if (baseUrl === './') {
    basename = ''
  } else if (baseUrl.endsWith('/')) {
    basename = baseUrl.slice(0, -1)
  }
  // Dev에서 실수로 /PargameBlog 경로로 접속했을 때도 동작하도록 보정
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/PargameBlog')) {
      basename = '/PargameBlog'
    }
  }
  
  return (
    <Router basename={basename}>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              Pargame Blog
            </Link>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/about" className="nav-link">
                  About
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/graph" className="nav-link">
                  Graph
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        
        <main className="main-content">
          <Suspense fallback={<div className="page"><p>Loading...</p></div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/posts/:slug" element={<PostPage />} />
            {/* dev에서 /PargameBlog/* 로 접근한 경우 홈으로 리다이렉트 */}
            {import.meta.env.DEV && (
              <Route path="/PargameBlog/*" element={<Navigate to={window.location.pathname.replace(/^\/PargameBlog/, '') || '/'} replace />} />
            )}
            <Route path="*" element={<div className="page"><p>페이지를 찾을 수 없습니다.</p><Link to="/">홈으로</Link></div>} />
          </Routes>
          </Suspense>
        </main>
  <Footer />
      </div>
    </Router>
  )
}

export default App
