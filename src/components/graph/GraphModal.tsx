/**
 * src/components/graph/GraphModal.tsx
 * 책임: 그래프 뷰용 모달 래퍼. 모달 레이아웃과 비동기 로딩(Suspense)을 담당.
 * - collection: 렌더할 컬렉션 식별자
 * - onClose: 모달 종료 콜백
 * - onNodeClick: 노드 클릭 핸들러(상위 전달)
 *
 * 주석 규칙: public props는 인터페이스 상단에 간단한 설명을 기록합니다.
 */
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
      <Suspense fallback={<div className="suspense-fallback">모달 로딩중…</div>}>
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
