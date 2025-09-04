import { useEffect, useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    // 크롤링 방지: 이메일을 런타임에 조합
    const user = '001201parg'
    const domain = 'gmail.com'
    setEmail(`${user}@${domain}`)
  }, [])

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-item">© Pargame (github)</div>
        <div className="footer-item">Contact Me! <a href={`mailto:${email}`}>{email || '(loading...)'}</a></div>
        <div className="footer-item">Built with Vite + React</div>
      </div>
    </footer>
  )
}
