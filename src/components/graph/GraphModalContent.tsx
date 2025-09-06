import React, { memo, useEffect, useRef, useState } from 'react'
import './GraphModalContent.css'
import logger from '../../lib/logger'
import type { GraphData, Post } from '../../types'
const GraphView = React.lazy(() => import('./GraphView'))

interface Props {
  collection: string
  onClose: () => void
  onNodeClick: (node: { id: string; title: string; missing?: boolean }) => void
  onGraphBackgroundClick: () => void
}

const GraphModalContent: React.FC<Props> = ({ collection, onClose, onNodeClick, onGraphBackgroundClick }) => {
  const [posts, setPosts] = useState<Array<{ slug: string; title: string }>>([])
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  useEffect(() => {
    let mounted = true
  ;(async () => {
      try {
        const gmod = await import('../../lib/graph')
        const d = await gmod.buildGraphForCollectionAsync(collection)
        if (!mounted) return
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
        const postsMod = await import('../../lib/posts')
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
        const mod = await import('../../lib/contentIndex')
        if (!mod.getContentItemsForCollectionAsync) return
        const items = await mod.getContentItemsForCollectionAsync(collection)
        if (!mounted) return
        setContentItems(items)
      } catch (err) {
        if (import.meta.env.DEV) logger.warn('[GraphModalContent] contentIndex load failed', err)
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
        const searchMod = await import('../../lib/search')
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
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="graph-modal-header-left">
            <h2 className="graph-modal-title">{collection} · Graph</h2>
          </div>

          <div className="graph-modal-header-right">
            <div className="graph-modal-search-wrapper">
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
                className="graph-search-input"
              />
              {open && results.length > 0 && (
                <div className="graph-search-results">
                  {results.map(r => (
                    <div key={r.slug}
                      onMouseDown={(ev) => { ev.preventDefault(); onNodeClick({ id: r.slug, title: r.title }) }}
                      className="graph-search-result-item">
                      <div className="graph-search-result-title">{r.title}</div>
                      <div className="graph-search-result-slug">{r.slug}</div>
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
            <React.Suspense fallback={<div className="suspense-fallback">그래프 로딩 중…</div>}>
              {graphData ? (
                <GraphView
                  data={graphData}
                  onNodeClick={onNodeClick}
                  onBackgroundClick={onGraphBackgroundClick}
                />
              ) : (
                <div className="suspense-fallback">그래프 데이터 준비 중…</div>
              )}
            </React.Suspense>
          </div>
        </div>
      </div>
    </>
  )
}

export default memo(GraphModalContent)
