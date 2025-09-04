import React, { memo, useMemo } from 'react'
import { buildGraphForCollection } from '../lib/graph'
import GraphView from './GraphView'

interface GraphModalProps {
  collection: string
  onClose: () => void
  onNodeClick: (node: { id: string; title: string; missing?: boolean }) => void
  onGraphBackgroundClick: () => void
}

const GraphModal: React.FC<GraphModalProps> = ({ collection, onClose, onNodeClick, onGraphBackgroundClick }) => {
  // Memoize graph data to avoid rebuilding on every render
  const graphData = useMemo(() => buildGraphForCollection(collection), [collection])
  
  return (
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{collection} · Graph</h2>
        <button className="icon" aria-label="close" onClick={onClose}>
          ✕
        </button>
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
