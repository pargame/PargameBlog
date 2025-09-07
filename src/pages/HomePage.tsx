/**
 * src/pages/HomePage.tsx
 * 책임: 홈 페이지 렌더링 (포스트 목록 로드 및 네비게이션)
 * 주요 export: default HomePage (React.FC)
 * 한글 설명: 비동기으로 포스트를 로드하여 최근 게시물 목록을 표시합니다.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPostDate } from '../lib/date';
import type { Post } from '../types'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[] | null>(null)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const mod = await import('../lib/posts')
        const all = await mod.loadAllPosts()
        if (mounted) setPosts(all)
      } catch {
        if (mounted) setPosts([])
      }
    })()
    return () => { mounted = false }
  }, [])
  return (
    <div className="page">
      <div className="hero-section">
        <h1 className="hero-title">Pargame's Postings</h1>
        <p className="hero-subtitle">마크다운으로 작성하면 포스팅되는 페이지입니다.</p>
      </div>
      
      <div className="content-section">
        <h2>Recent Postings</h2>
        {(() => {
          if (posts === null) {
            return <p>포스트 로딩 중…</p>
          }
          if (!posts || posts.length === 0) {
            return (
              <p>아직 게시된 포스트가 없어요. <em>content/Postings</em> 폴더에 마크다운 파일(.md)을 추가해 주세요.</p>
            )
          }
          return posts.map(post => (
            <div
              className="post-preview"
              key={post.slug}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/posts/${post.slug}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/posts/${post.slug}`) } }}
            >
              <h3>
                <Link to={`/posts/${post.slug}`} onClick={(e) => { e.stopPropagation() }}>{post.meta.title}</Link>
              </h3>
              {post.meta.excerpt ? <p>{post.meta.excerpt}</p> : null}
              <small>
                {formatPostDate(post.meta.date)}
                {post.meta.author ? ` · ${post.meta.author}` : null}
              </small>
            </div>
          ))
        })()}
      </div>
    </div>
  );
};

export default HomePage;
