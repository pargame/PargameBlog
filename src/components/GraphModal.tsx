import React from 'react'
import { buildGraphForCollection } from '../lib/graph'
import GraphView from './GraphView'

interface GraphModalProps {
  collection: string
  onClose: () => void
  onNodeClick: (nodeId: string) => void
}

const GraphModal: React.FC<GraphModalProps> = ({ collection, onClose, onNodeClick }) => {
  return (
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{collection} · Graph</h2>
        <button className="icon" aria-label="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        <div style={{ height: '100%', minHeight: 360 }}>
          <GraphView
            data={buildGraphForCollection(collection)}
            onNodeClick={(node) => onNodeClick(node.id)}
          />
        </div>
      </div>
    </div>
  )
}

export default GraphModal
