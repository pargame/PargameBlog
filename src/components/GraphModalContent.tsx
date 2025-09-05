import React, { memo, useEffect, useRef, useState } from 'react'
import logger from '../lib/logger'
import type { GraphData, Post } from '../types'
// graph builder will be dynamically imported to keep this chunk small
const GraphView = React.lazy(() => import('./GraphView'))
// content index will be loaded dynamically

interface Props {
  collection: string
  onClose: () => void
  onNodeClick: (node: { id: string; title: string; missing?: boolean }) => void
  onGraphBackgroundClick: () => void
}

const GraphModalContent: React.FC<Props> = ({ collection, onClose, onNodeClick, onGraphBackgroundClick }) => {
  const [posts, setPosts] = useState<Array<{ slug: string; title: string }>>([])

  // Build graph data asynchronously so content markdown can be code-split
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  useEffect(() => {
    let mounted = true
  ;(async () => {
      try {
        const gmod = await import('../lib/graph')
        const d = await gmod.buildGraphForCollectionAsync(collection)
        if (!mounted) return
  // debug removed
        setGraphData(d)
      } catch (_err) {
        if (import.meta.env.DEV) logger.warn('[GraphModalContent] graph build failed', _err)
      }
    })()
    return () => { mounted = false }
  }, [collection])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const postsMod = await import('../lib/posts')
        const all: Post[] = await postsMod.loadAllPosts()
        if (!mounted) return
        const mapped = all.map((p: Post) => ({ slug: p.slug, title: p.meta?.title ?? p.slug }))
        setPosts(mapped)
      } catch (_err) {
        if (import.meta.env.DEV) logger.warn('[GraphModalContent] posts load failed', _err)
      }
    })()
    return () => { mounted = false }
  }, [])

  const [contentItems, setContentItems] = useState<{slug:string;title:string}[]>([])
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const mod = await import('../lib/contentIndex')
        if (!mod.getContentItemsForCollectionAsync) return
        const items = await mod.getContentItemsForCollectionAsync(collection)
        if (!mounted) return
        setContentItems(items)
      } catch {
        /* ignore content index load errors */
      }
    })()
    return () => { mounted = false }
  }, [collection])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{slug:string;title:string}[]>([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    ;(async () => {
      try {
        const searchMod = await import('../lib/search')
        const source = contentItems.length > 0 ? contentItems : posts
        const found = searchMod.searchItems(source, query)
        setResults(found)
      } catch {
        setResults([])
      }
    })()
  }, [query, posts, contentItems])

  return (
    <>
      {/* small on-screen debug badge to help confirm this component rendered */}
    {/* debug badge removed */}
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>{collection} · Graph</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                id="graph-search-input"
                name="graph-search"
                aria-label={`Search ${collection}`}
                autoComplete="off"
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                placeholder={contentItems.length > 0 ? `Search ${collection}...` : 'Search posts...'}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-1)',
                  minWidth: 200
                }}
              />
              {open && results.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                  zIndex: 60,
                  minWidth: 260,
                  overflow: 'hidden'
                }}>
                  {results.map(r => (
                    <div key={r.slug}
                      onMouseDown={(ev) => { ev.preventDefault(); onNodeClick({ id: r.slug, title: r.title }) }}
                      style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 13 }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.slug}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="icon" aria-label="close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        <div className="modal-body">
          <div className="graph-modal-body">
            <React.Suspense fallback={<div style={{ padding: 20 }}>그래프 로딩 중…</div>}>
              {graphData ? (
                <GraphView
                  data={graphData}
                  onNodeClick={onNodeClick}
                  onBackgroundClick={onGraphBackgroundClick}
                />
              ) : (
                <div style={{ padding: 20 }}>그래프 데이터 준비 중…</div>
              )}
            </React.Suspense>
          </div>
        </div>
      </div>
    </>
  )
}

export default memo(GraphModalContent)
