import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listContentCollections } from '../lib/content'
// GraphModal is heavy (GraphView + d3). Lazy-load it so initial bundle stays small.
const GraphModal = lazy(() => import('../components/graph/GraphModal'))
// InsightDrawer uses react-markdown and remark-gfm; lazy-load to avoid bundling them in GraphPage
const InsightDrawer = lazy(() => import('../components/InsightDrawer'))
import CollectionCard from '../components/CollectionCard'

const GraphPage: React.FC = () => {
  // State
  const collections = useMemo(() => listContentCollections(), [])
  const [opened, setOpened] = useState<string | null>(null)
  const [insightId, setInsightId] = useState<string | null>(null)
  const insightIdRef = useRef<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    insightIdRef.current = insightId
  }, [insightId])
  
  // Auto-open when ?open=<collection>
  // Note: intentionally omit `opened` from deps to avoid a race where
  // clearing `opened` (on modal close) would cause this effect to run
  // while the URL still contains the param, immediately re-opening the
  // modal. We only want to respond to URL changes and collection list
  // updates here.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const toOpen = params.get('open')
    if (toOpen && collections.includes(toOpen) && opened !== toOpen) {
      setOpened(toOpen)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, collections])

  // Keep the URL `?open=` param in sync with local `opened` state. This
  // centralizes navigation and avoids races where we set state and then
  // imperatively navigate which could cause duplicate open calls.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (opened) params.set('open', opened)
    else params.delete('open')
    const search = params.toString() ? `?${params.toString()}` : ''
    // Replace history entry rather than push to avoid cluttering history.
    navigate({ pathname: location.pathname, search }, { replace: true })
  }, [opened, location.pathname, location.search, navigate])
  
  // Ref for latest insightId value (to avoid closure issues)
  // Event handlers
  const handleCloseModal = useCallback(() => {
    // Only update local state; URL will be synced by the effect watching
    // `opened`.
    setOpened(null)
    setInsightId(null)
  }, [])

  const handleCloseInsight = useCallback(() => {
    setInsightId(null)
  }, [])

  const handleNodeClick = useCallback((node: { id: string; title: string; missing?: boolean }) => {
    if (node.missing) return
    setInsightId(node.id)
  }, [])

  const handleWikiLinkClick = useCallback((target: string) => {
    setInsightId(target)
  }, [])

  const handleGraphBackgroundClick = useCallback(() => {
    // Read latest insightId from ref to avoid stale-closure issues inside D3 handlers
    if (insightIdRef.current) {
      handleCloseInsight()
    }
  }, [handleCloseInsight])

  return (
    <div className="page">
      <div className="hero-section">
        <h1 className="hero-title">Graph</h1>
        <p className="hero-subtitle">그래프와 검색창으로 쉽게 학습하세요!</p>
      </div>

      <div className="content-section">
        <h2>Graph Archives</h2>
        {collections.length === 0 ? (
          <p>아직 아카이브가 없습니다. <em>src/content/&lt;name&gt;</em>에 마크다운을 추가해 보세요.</p>
        ) : (
          collections.map(name => (
              <CollectionCard key={name} name={name} onOpen={(v) => setOpened(v)} />
            ))
        )}
      </div>

      {opened && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <Suspense fallback={<div className="suspense-fallback-hero">로딩 중…</div>}>
            <GraphModal 
              key={opened}
              collection={opened}
              onClose={handleCloseModal}
              onNodeClick={handleNodeClick}
              onGraphBackgroundClick={handleGraphBackgroundClick}
            />
          </Suspense>
          <Suspense fallback={<div className="suspense-fallback-small">패널 준비중…</div>}>
            <InsightDrawer
              collection={opened}
              insightId={insightId}
              onWikiLinkClick={handleWikiLinkClick}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}

export default GraphPage
