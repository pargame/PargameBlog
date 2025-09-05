import React, { useEffect, useState } from 'react'
import logger from '../lib/logger'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { getPostBySlug } from '../lib/posts'
import markdownToHtml from '../lib/markdownToHtml'

type MarkdownPlugin = unknown

function createSafeWrapper(candidate: unknown): MarkdownPlugin | null {
  if (typeof candidate !== 'function') return null
  const originalFn = candidate as (...a: unknown[]) => unknown
  return function safeAttacher(this: unknown, ...args: unknown[]) {
    // If `this` is not a unified Processor (no `data`), skip attaching the
    // plugin to avoid runtime TypeErrors. This means GFM features won't be
    // enabled for this render, but it prevents the page from crashing.
    const processorLike = this as unknown as { data?: unknown }
      if (!processorLike || typeof processorLike.data !== 'function') {
        // silently skip attaching remark-gfm when `this` is not a unified
        // processor (prevents noisy logs in StrictMode double-invokes).
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
  const post = slug ? getPostBySlug(slug) : undefined
  const [remarkGfm, setRemarkGfm] = useState<MarkdownPlugin | null>(null)
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const mod = await import('remark-gfm')
        const candidate = (mod as unknown as Record<string, unknown>).default ?? mod
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
