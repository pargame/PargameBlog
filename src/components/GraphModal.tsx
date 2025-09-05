import React, { Suspense, memo } from 'react'

const GraphModalContent = React.lazy(() => import('./GraphModalContent'))

interface GraphModalProps {
  collection: string
  onClose: () => void
  onNodeClick: (node: { id: string; title: string; missing?: boolean }) => void
  onGraphBackgroundClick: () => void
}

const GraphModal: React.FC<GraphModalProps> = ({ collection, onClose, onNodeClick, onGraphBackgroundClick }) => {
  return (
    <div className="modal" onClick={e => e.stopPropagation()}>
      <Suspense fallback={<div style={{ padding: 20 }}>모달 로딩중…</div>}>
        <GraphModalContent
          collection={collection}
          onClose={onClose}
          onNodeClick={onNodeClick}
          onGraphBackgroundClick={onGraphBackgroundClick}
        />
      </Suspense>
    </div>
  )
}

export default memo(GraphModal)
