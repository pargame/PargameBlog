import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { listContentCollections } from '../lib/content'
import GraphModal from '../components/GraphModal'
import InsightDrawer from '../components/InsightDrawer'
import CollectionCard from '../components/CollectionCard'

const GraphPage: React.FC = () => {
  // State
  const collections = useMemo(() => listContentCollections(), [])
  const [opened, setOpened] = useState<string | null>(null)
  const [insightId, setInsightId] = useState<string | null>(null)
  const insightIdRef = useRef<string | null>(null)

  useEffect(() => {
    insightIdRef.current = insightId
  }, [insightId])
  
  // Ref for latest insightId value (to avoid closure issues)
  // Event handlers
  const handleCloseModal = useCallback(() => {
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
            <CollectionCard key={name} name={name} onOpen={setOpened} />
          ))
        )}
      </div>

      {opened && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <GraphModal 
            key={opened}
            collection={opened}
            onClose={handleCloseModal}
            onNodeClick={handleNodeClick}
            onGraphBackgroundClick={handleGraphBackgroundClick}
          />
          <InsightDrawer
            collection={opened}
            insightId={insightId}
            onWikiLinkClick={handleWikiLinkClick}
          />
        </div>
      )}
    </div>
  )
}

export default GraphPage
