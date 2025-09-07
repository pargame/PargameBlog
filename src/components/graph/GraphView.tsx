/**
 * src/components/graph/GraphView.tsx
 * 책임: Graph SVG 렌더링 및 GraphControls 연결을 담당하는 UI 컴포넌트
 * 주요 props: data: GraphData, onNodeClick?, onBackgroundClick?
 * 한글 설명: D3 시뮬레이션 훅(`useGraphSimulation`)에 DOM refs를 전달합니다.
 */
import React, { memo, useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { GraphData, GraphNode } from '../../types'
import './GraphView.css'
import GraphControls from './GraphControls'
import useGraphSimulation from '../../hooks/useGraphSimulation'

type NodeDatum = GraphNode & {
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

type LinkDatum = {
  source: string | NodeDatum
  target: string | NodeDatum
}

type Props = {
  data: GraphData
  width?: number
  height?: number
  onNodeClick?: (node: { id: string; title: string; missing?: boolean }) => void
  onBackgroundClick?: () => void
}

const GraphView: React.FC<Props> = ({ data, width = 800, height = 520, onNodeClick, onBackgroundClick }) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: width, h: height })
  const initializedRef = useRef(false)
  const kickTimerRef = useRef<number | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const simulationRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null)
  const simulationStoppedRef = useRef<boolean | null>(null)
  const nodeSelRef = useRef<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const linkSelRef = useRef<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>(null)
  const labelSelRef = useRef<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const [showMissing, setShowMissing] = useState(true)

  // 배경 클릭은 훅에서 삽입하는 bg-rect가 처리합니다. 래퍼에서는 중복 처리하지 않습니다.

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const cr = entries[0]?.contentRect
      if (cr) setDims({ w: Math.max(320, cr.width), h: Math.max(240, cr.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useGraphSimulation({
    svgRef,
    dims,
  width,
  height,
    data: { nodes: data.nodes, links: data.links },
    onNodeClick,
    onBackgroundClick,
    initializedRef,
    kickTimerRef,
    zoomRef,
    simulationRef,
    nodeSelRef,
    linkSelRef,
    labelSelRef,
  showMissing,
  simulationStoppedRef,
  })


  return (
    <div ref={wrapRef} className="graph-wrap">
      <svg ref={svgRef} role="img" aria-label="graph view" />

  <GraphControls showMissing={showMissing} onToggleShowMissing={() => setShowMissing((v) => !v)} />
    </div>
  )
}

export default memo(GraphView)
