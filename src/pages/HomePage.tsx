import React from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts } from '../lib/posts';

const HomePage: React.FC = () => {
  return (
    <div className="page">
      <div className="hero-section">
        <h1 className="hero-title">Pargame's Postings</h1>
        <p className="hero-subtitle">주제에 상관 없이 글을 올리는 공간입니다.</p>
      </div>
      
      <div className="content-section">
        <h2>최근 포스트</h2>
        {(() => {
          const posts = getAllPosts()
          if (!posts || posts.length === 0) {
            return (
              <p>아직 게시된 포스트가 없어요. <em>src/posts</em> 폴더에 마크다운 파일(.md)을 추가해 주세요.</p>
            )
          }
          return posts.map(post => (
            <div className="post-preview" key={post.slug}>
              <h3>
                <Link to={`/posts/${post.slug}`}>{post.meta.title}</Link>
              </h3>
              {post.meta.excerpt ? <p>{post.meta.excerpt}</p> : null}
              <small>
                {post.meta.date}
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
