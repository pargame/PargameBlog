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
        Include Missings
      </label>
    </div>
  )
}

export default GraphControls
