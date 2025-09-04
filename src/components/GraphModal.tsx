import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { buildGraphForCollection } from '../lib/graph'
import GraphView from './GraphView'
import { getAllPosts } from '../lib/posts'
import { searchItems } from '../lib/search'
import { getContentItemsForCollection } from '../lib/contentIndex'

interface GraphModalProps {
  collection: string
  onClose: () => void
  onNodeClick: (node: { id: string; title: string; missing?: boolean }) => void
  onGraphBackgroundClick: () => void
}

const GraphModal: React.FC<GraphModalProps> = ({ collection, onClose, onNodeClick, onGraphBackgroundClick }) => {
  // Memoize graph data to avoid rebuilding on every render
  const graphData = useMemo(() => buildGraphForCollection(collection), [collection])
  const posts = useMemo(() => getAllPosts().map(p => ({ slug: p.slug, title: p.meta.title })), [])
  // If the modal is opened for a content collection (e.g. 'UnrealEngine'), prefer searching those files
  const contentItems = useMemo(() => getContentItemsForCollection(collection), [collection])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{slug:string;title:string}[]>([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    const source = contentItems.length > 0 ? contentItems : posts
    setResults(searchItems(source, query))
  }, [query, posts, contentItems])
  
  return (
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>{collection} · Graph</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <input
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
          <GraphView
            data={graphData}
            onNodeClick={onNodeClick}
            onBackgroundClick={onGraphBackgroundClick}
          />
        </div>
      </div>
    </div>
  )
}

export default memo(GraphModal)
