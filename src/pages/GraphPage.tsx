import React, { useMemo, useRef, useState } from 'react'
import { listContentCollections } from '../lib/content'
import { buildGraphForCollection } from '../lib/graph'
import GraphView from '../components/GraphView'
import { getDocFromCollection } from '../lib/doc'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkWikiLinkToSpan from '../lib/remarkWikiLinkToSpan'

const GraphPage: React.FC = () => {
  const collections = useMemo(() => listContentCollections(), [])
  const [opened, setOpened] = useState<string | null>(null)
  const [insightId, setInsightId] = useState<string | null>(null)
  // Drawer width is controlled purely by CSS (50vw). No resizer.
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // When switching doc, scroll to top of drawer
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [insightId])

  return (
    <div className="page">
      <div className="hero-section">
        <h1 className="hero-title">Graph</h1>
        <p className="hero-subtitle">그래프 뷰를 원하는 아카이브를 선택하시면 뷰가 열립니다.</p>
      </div>

      <div className="content-section graph-collections">
        <div className="grid buttons">
          {collections.length === 0 ? (
            <p>아직 아카이브가 없습니다. <em>src/content/&lt;name&gt;</em>에 마크다운을 추가해 보세요.</p>
          ) : (
            collections.map(name => (
              <button key={name} className="pill pill-lg" onClick={() => setOpened(name)}>
                {name}
              </button>
            ))
          )}
        </div>
      </div>

      {opened && (
        <div className="modal-backdrop" onClick={() => { setOpened(null); setInsightId(null) }}>
          {/* Centered graph modal */}
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{opened} · Graph</h2>
              <button className="icon" aria-label="close" onClick={() => { setOpened(null); setInsightId(null) }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{height: '100%', minHeight: 360}}>
                <GraphView
                  data={buildGraphForCollection(opened)}
                  onNodeClick={(node) => {
                    setInsightId(node.id)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right-side insight drawer (outside the modal, within full-screen backdrop) */}
          <aside
            className={`insight-drawer ${insightId ? 'open' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {insightId ? (
              (() => {
                const doc = getDocFromCollection(opened, insightId)
                if (!doc) return <div className="insight-empty">문서를 찾을 수 없습니다.</div>
                return (
                  <div className="insight-content">
                    <header>
                      <h3>{doc.title}</h3>
                      <button className="icon" aria-label="close insight" onClick={() => setInsightId(null)}>✕</button>
                    </header>
                    <div className="insight-scroll" ref={scrollRef}>
                      <ReactMarkdown
                        // react-markdown의 remarkPlugins는 플러그인 팩토리 배열을 받습니다.
                        // 우리 커스텀 플러그인은 인자 없는 팩토리이므로 그대로 넘깁니다.
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
                                  onClick={() => setInsightId(target)}
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
                )
              })()
            ) : (
              <div className="insight-empty">노드를 클릭하면 문서가 여기 열립니다.</div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default GraphPage
