import React, { useMemo, useState } from 'react'
import { listContentCollections } from '../lib/content'
import GraphModal from '../components/GraphModal'
import InsightDrawer from '../components/InsightDrawer'

const GraphPage: React.FC = () => {
  const collections = useMemo(() => listContentCollections(), [])
  const [opened, setOpened] = useState<string | null>(null)
  const [insightId, setInsightId] = useState<string | null>(null)

  const handleCloseModal = () => {
    setOpened(null)
    setInsightId(null)
  }

  const handleNodeClick = (nodeId: string) => {
    setInsightId(nodeId)
  }

  const handleCloseInsight = () => {
    setInsightId(null)
  }

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
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <GraphModal 
            collection={opened}
            onClose={handleCloseModal}
            onNodeClick={handleNodeClick}
          />
          <InsightDrawer
            collection={opened}
            insightId={insightId}
            onClose={handleCloseInsight}
            onWikiLinkClick={setInsightId}
          />
        </div>
      )}
    </div>
  )
}

export default GraphPage
