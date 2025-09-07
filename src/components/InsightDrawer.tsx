/**
 * src/components/InsightDrawer.tsx
 * Responsibility: Default export memo
 * Auto-generated header: add more descriptive responsibility by hand.
 */

import React, { Suspense, memo, useEffect, useRef, useState } from 'react'
import logger from '../lib/logger'
// react-markdown's types vary across versions; accept a loose plugin type locally
// Loose plugin type using unknown to avoid `any` lint rule; cast to expected runtime shape when used.
// heavy modules will be dynamically imported below
const LazyMarkdown = React.lazy(async () => {
  const mod = await import('react-markdown')
  return { default: mod.default }
})
// light util stays static
import remarkWikiLinkToSpan from '../lib/remarkWikiLinkToSpan'

type Doc = { content: string }

interface InsightDrawerProps {
  collection: string
  insightId: string | null
  onWikiLinkClick: (target: string) => void
}

// Small local error boundary to prevent the entire modal from going blank
class LocalErrorBoundary extends React.Component<{
  children: React.ReactNode
}, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    // route via logger so behavior can be controlled by environment
    logger.error('InsightDrawer render error:', error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="suspense-fallback-small">
          문서 렌더링 중 오류가 발생했습니다.
        </div>
      )
    }
    return this.props.children as React.ReactElement
  }
}

const InsightDrawer: React.FC<InsightDrawerProps> = ({ 
  collection, 
  insightId, 
  onWikiLinkClick 
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [doc, setDoc] = useState<Doc | null>(null)
  // No remark-gfm in the drawer to avoid runtime plugin `this` issues;
  // GFM support remains in the main PostPage which loads remark-gfm safely.
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
  ;(async () => {
  // load doc lazily
      try {
        const docMod = await import('../lib/doc')
        const found = insightId ? docMod.getDocFromCollection(collection, insightId) : null
        if (mounted) setDoc(found ?? null)
      } catch {
        if (mounted) setDoc(null)
      }
  // Note: intentionally not loading `remark-gfm` here - it can require
  // a unified processor `this` which may not be available in this lazy
  // environment and caused blank modal crashes. PostPage handles GFM.
    })()
    return () => { mounted = false }
  }, [collection, insightId])

  // Load list of available doc ids for this collection to style missing links differently
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const mod = await import('../lib/contentIndex')
        if (mod.getContentItemsForCollectionAsync) {
          const items = await mod.getContentItemsForCollectionAsync(collection)
          if (!mounted) return
          setKnownIds(new Set(items.map(i => i.slug)))
        } else {
          if (!mounted) return
          setKnownIds(new Set())
        }
      } catch {
        if (!mounted) return
        setKnownIds(new Set())
      }
    })()
    return () => { mounted = false }
  }, [collection])

  // When switching doc, scroll to top of drawer
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [insightId])

  if (!insightId) {
    return (
      <aside className="insight-drawer" onClick={e => e.stopPropagation()}>
        <div className="insight-empty">노드를 클릭하면 문서가 여기 열립니다.</div>
      </aside>
    )
  }
  if (!doc) {
    return (
      <aside className="insight-drawer open" onClick={e => e.stopPropagation()}>
        <div className="insight-content">
          <div className="insight-scroll">
            <div className="insight-empty">요청한 문서를 찾을 수 없습니다.{' '}
              {insightId ? <em>({insightId})</em> : null}
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside 
      className="insight-drawer open" 
      onClick={(e) => {
        // Prevent clicks inside the drawer from bubbling to the backdrop
        e.stopPropagation()
      }}
    >
      <div className="insight-content">
        <div className="insight-scroll" ref={scrollRef}>
          <Suspense fallback={<div className="suspense-fallback-small">문서 렌더링 준비중…</div>}>
          <LocalErrorBoundary>
          <LazyMarkdown
            remarkPlugins={[remarkWikiLinkToSpan]}
            components={{
              a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
                // Helper to recursively extract plain text from children for heuristic
                const textFromChildren = (node: unknown): string => {
                  if (node == null) return ''
                  if (typeof node === 'string') return node
                  if (Array.isArray(node)) return (node as unknown[]).map(textFromChildren).join('')
                  if (typeof node === 'object' && node !== null && 'props' in (node as Record<string, unknown>)) {
                    return textFromChildren((node as { props?: { children?: unknown } }).props?.children)
                  }
                  return ''
                }

                // Determine target either from href (wikilink:Target) or from child text
                let targetFromHref: string | null = null
                if (href && href.startsWith('wikilink:')) {
                  targetFromHref = href.slice('wikilink:'.length)
                }
                const labelText = textFromChildren(children).trim()

                // Accept Unicode letters/numbers as valid wiki token text (allows 한글, etc.)
                const looksLikeWikiToken = (!href || href === '') && !!labelText && /^[\p{L}\p{N}_.-]+$/u.test(labelText)
                const isWiki = !!targetFromHref || looksLikeWikiToken
                const target = targetFromHref || labelText

                if (isWiki && target) {
                  // Determine missing by checking current collection's known ids
                  const base = target.split('#')[0].trim()
                  const missing = !knownIds.has(base)
                  return (
                    <span
                      className={`wikilink${missing ? ' missing' : ''}`}
                      data-target={target}
                      title={missing ? '문서를 찾을 수 없습니다' : undefined}
                      onClick={(e) => {
                        e.preventDefault()
                        if (onWikiLinkClick) onWikiLinkClick(target)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (onWikiLinkClick) onWikiLinkClick(target)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {children as React.ReactNode}
                    </span>
                  )
                }
                // 빈 href는 자동 무시: 앵커 대신 텍스트만 렌더
                if (!href) {
                  return <span>{children as React.ReactNode}</span>
                }
                return <a href={href}>{children as React.ReactNode}</a>
              },
            }}
          >
            {doc?.content || ''}
          </LazyMarkdown>
          </LocalErrorBoundary>
          </Suspense>
        </div>
      </div>
    </aside>
  )
}

export default memo(InsightDrawer)
