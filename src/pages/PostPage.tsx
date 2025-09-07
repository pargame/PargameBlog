/**
 * src/pages/PostPage.tsx
 * 책임: 개별 포스트 로딩 및 렌더링
 * 주요 export: default PostPage (React.FC)
 * 한글 설명: remark-gfm는 런타임에 안전하게 lazy 로드합니다.
 */

import React, { useEffect, useState } from 'react'
import type { Post } from '../types'
import logger from '../lib/logger'
import unwrapModuleDefault from '../lib/moduleUtils'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { getPostBySlugAsync } from '../lib/posts'
import markdownToHtml from '../lib/markdownToHtml'

type MarkdownPlugin = unknown

function createSafeWrapper(candidate: unknown): MarkdownPlugin | null {
  if (typeof candidate !== 'function') return null
  const originalFn = candidate as (...a: unknown[]) => unknown
  return function safeAttacher(this: unknown, ...args: unknown[]) {
    // `this`가 통합 Processor가 아니면 (data 없음), 런타임 TypeErrors를 피하기 위해
    // 플러그인을 첨부하지 않습니다. 이는 이 렌더링에서 GFM 기능이 활성화되지 않음을 의미하지만,
    // 페이지를 충돌시키는 것을 방지합니다.
    interface ProcessorLike { data?: unknown }
    const processorLike = this as ProcessorLike
    if (!processorLike || typeof (processorLike.data as unknown) !== 'function') {
        // `this`가 통합 processor가 아닐 때 remark-gfm 첨부를 조용히 건너뜁니다
        // (StrictMode double-invokes에서 시끄러운 로그를 방지합니다).
        return function () { return function noopTransformer(tree: unknown) { return tree } }
      }
    try {
      return originalFn.apply(this, args)
    } catch (e) {
      logger.error('remark-gfm plugin threw during attach:', e)
      return function () { return function noopTransformer(tree: unknown) { return tree } }
    }
  }
}

const PostPage: React.FC = () => {
  const { slug } = useParams()
  const [post, setPost] = useState<Post | undefined>(undefined)
  const [remarkGfm, setRemarkGfm] = useState<MarkdownPlugin | null>(null)
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const mod = await import('remark-gfm')
  const candidate = unwrapModuleDefault<unknown>(mod)
        const wrapped = createSafeWrapper(candidate)
        if (mounted) setRemarkGfm(wrapped)
      } catch {
        if (mounted) setRemarkGfm(null)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!slug) return
      try {
        const p = await getPostBySlugAsync(slug)
        if (!mounted) return
        setPost(p)
      } catch (e) {
        logger.error('failed to load post:', e)
        if (!mounted) return
        setPost(undefined)
      }
    })()
    return () => { mounted = false }
  }, [slug])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!post) return
      try {
        const out = await markdownToHtml(post.content)
        if (!mounted) return
        setHtml(out)
      } catch (e) {
        logger.error('markdownToHtml failed:', e)
        if (!mounted) return
        setHtml(null)
      }
    })()
    return () => { mounted = false }
  }, [post])

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
        {/* Prefer sanitized HTML produced by unified pipeline for consistency across content and posts. */}
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <ReactMarkdown remarkPlugins={remarkGfm ? [remarkGfm] : []}>{post.content}</ReactMarkdown>
        )}
      </div>
    </div>
  )
}

export default PostPage
