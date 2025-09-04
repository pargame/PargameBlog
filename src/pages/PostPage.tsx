import React from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPostBySlug } from '../lib/posts'

const PostPage: React.FC = () => {
  const { slug } = useParams()
  const post = slug ? getPostBySlug(slug) : undefined

  if (!post) {
    return (
      <div className="page">
        <p>포스트를 찾을 수 없습니다.</p>
        <Link to="/">홈으로 돌아가기</Link>
      </div>
    )
  }

  return (
    <div className="page content-section">
      <header className="post-header">
        <h1>{post.meta.title}</h1>
        <small>
          {post.meta.date}
          {post.meta.author ? ` · ${post.meta.author}` : null}
        </small>
      </header>
      <div className="post-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </div>
  )
}

export default PostPage
