import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkWikiLinkToSpan from '../lib/remarkWikiLinkToSpan'
import { getDocFromCollection } from '../lib/doc'

interface InsightDrawerProps {
  collection: string
  insightId: string | null
  onClose: () => void
  onWikiLinkClick: (target: string) => void
}

const InsightDrawer: React.FC<InsightDrawerProps> = ({ 
  collection, 
  insightId, 
  onClose, 
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
        <div className="insight-empty">문서를 찾을 수 없습니다.</div>
      </aside>
    )
  }

  return (
    <aside className="insight-drawer open" onClick={e => e.stopPropagation()}>
      <div className="insight-content">
        <header>
          <h3>{doc.title}</h3>
          <button className="icon" aria-label="close insight" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="insight-scroll" ref={scrollRef}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkWikiLinkToSpan]}
            components={{
              a: ({ href, children }) => {
                // Render our wikilink scheme as a styled span (no navigation)
                if (href && href.startsWith('wikilink:')) {
                  const target = href.slice('wikilink:'.length)
                  return (
                    <span
                      className="wikilink"
                      data-target={target}
                      onClick={() => onWikiLinkClick(target)}
                      role="button"
                      tabIndex={0}
                    >
                      {children}
                    </span>
                  )
                }
                return <a href={href || undefined}>{children}</a>
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

export default InsightDrawer
