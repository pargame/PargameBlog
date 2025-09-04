import { Link, Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import PostPage from './pages/PostPage'
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
                  소개
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/posts/:slug" element={<PostPage />} />
            {/* dev에서 /PargameBlog/* 로 접근한 경우 홈으로 리다이렉트 */}
            {import.meta.env.DEV && (
              <Route path="/PargameBlog/*" element={<Navigate to={window.location.pathname.replace(/^\/PargameBlog/, '') || '/'} replace />} />
            )}
            <Route path="*" element={<div className="page"><p>페이지를 찾을 수 없습니다.</p><Link to="/">홈으로</Link></div>} />
          </Routes>
        </main>
        <footer className="site-footer">
          <div className="footer-container">
            <div className="footer-item">© Pargame (github)</div>
            <div className="footer-item">Contact Me! <a id="contact-email" href="#">(email)</a></div>
            <div className="footer-item">Built with Vite + React</div>
          </div>
          <script dangerouslySetInnerHTML={{ __html: `(() => {
            const user = '001201parg';
            const domain = 'gmail.com';
            const email = user + '@' + domain;
            const a = document.getElementById('contact-email');
            if (a) { a.textContent = email; a.href = 'mailto:' + email; }
          })()` }} />
        </footer>
      </div>
    </Router>
  )
}

export default App
