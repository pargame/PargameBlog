/**
 * src/components/graph/GraphModalContent.tsx
 * 책임: GraphModal 내부의 콘텐츠 로직을 처리한다.
 * - 비동기 로딩: graph builder, posts, contentIndex 등을 lazy import로 로드
 * - 검색/검색 결과 렌더링
 * - GraphView를 Suspense로 감싸 렌더링
 *
 * 주석 규칙: 비동기 경로(import ...) 및 중요한 상태값(useState/useEffect)을 단락 주석으로 설명합니다.
 */
import React, { memo, useEffect, useRef, useState } from 'react'
import './GraphModalContent.css'
import logger from '../../lib/logger'
import type { GraphData } from '../../types'
const GraphView = React.lazy(() => import('./GraphView'))

interface Props {
  collection: string
  onClose: () => void
  onNodeClick: (node: { id: string; title: string; missing?: boolean }) => void
  onGraphBackgroundClick: () => void
  selectedNodeId?: string | null
}

  const GraphModalContent: React.FC<Props> = ({ collection, onClose, onNodeClick, onGraphBackgroundClick, selectedNodeId }) => {
  // Derive a human-friendly label: only the last segment of collection path
  const leafName = collection.split('/').filter(Boolean).pop() || collection
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

  // Removed global posts fetch: search is now strictly scoped to the current collection.

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
        const found = searchMod.searchItems(contentItems, query)
        setResults(found)
      } catch {
        setResults([])
      }
    })()
  }, [query, contentItems])

  return (
    <>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="graph-modal-header-left">
            <h2 className="graph-modal-title">{leafName} · Graph</h2>
          </div>

          <div className="graph-modal-header-right">
            <div className="graph-modal-search-wrapper">
              <input
                id="graph-search-input"
                name="graph-search"
                aria-label={`Search ${leafName}`}
                autoComplete="off"
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                placeholder={contentItems.length > 0 ? `Search ${leafName}...` : 'Search posts...'}
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
                  selectedNodeId={selectedNodeId}
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
