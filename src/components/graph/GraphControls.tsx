/**
 * src/components/graph/GraphControls.tsx
 * 책임: GraphView의 간단한 UI 컨트롤(예: missing 토글)을 제공한다.
 * - showMissing: 현재 missing 노드를 표시할지 여부
 * - onToggleShowMissing: 토글 콜백
 *
 * 주석 규칙: 작은 재사용 컴포넌트는 prop 의미를 상단에 명확히 적습니다.
 */
import React from 'react'
import './GraphControls.css'

type Props = {
  showMissing: boolean
  onToggleShowMissing: () => void
}

const GraphControls: React.FC<Props> = ({ showMissing, onToggleShowMissing }) => {
  return (
    <div className="graph-controls">
      <label className="graph-controls-label">
        <input
          className="graph-controls-checkbox"
          type="checkbox"
          checked={showMissing}
          onChange={onToggleShowMissing}
        />
  누락 항목 포함
      </label>
    </div>
  )
}

export default GraphControls
