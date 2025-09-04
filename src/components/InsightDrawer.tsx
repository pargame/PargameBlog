import React, { memo, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkWikiLinkToSpan from '../lib/remarkWikiLinkToSpan'
import { getDocFromCollection } from '../lib/doc'

interface InsightDrawerProps {
  collection: string
  insightId: string | null
  onWikiLinkClick: (target: string) => void
}

const InsightDrawer: React.FC<InsightDrawerProps> = ({ 
  collection, 
  insightId, 
  onWikiLinkClick 
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)

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
  const doc = getDocFromCollection(collection, insightId)
  
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
          <ReactMarkdown
            remarkPlugins={[remarkWikiLinkToSpan, remarkGfm]}
            components={{
              a: ({ href, children }) => {
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

                const looksLikeWikiToken = (!href || href === '') && !!labelText && /^[A-Za-z0-9_.-]+$/.test(labelText)
                const isWiki = !!targetFromHref || looksLikeWikiToken
                const target = targetFromHref || labelText

                if (isWiki && target) {
                  const missing = !getDocFromCollection(collection, target)
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
                      {children}
                    </span>
                  )
                }
                // 빈 href는 자동 무시: 앵커 대신 텍스트만 렌더
                if (!href) {
                  return <span>{children}</span>
                }
                return <a href={href}>{children}</a>
              },
            }}
          >
            {doc.content}
          </ReactMarkdown>
        </div>
      </div>
    </aside>
  )
}

export default memo(InsightDrawer)
