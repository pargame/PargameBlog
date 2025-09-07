/**
 * src/components/graph/GraphView.tsx
 * 책임: 그래프 SVG 래퍼 컴포넌트. UI 제어(토글, 리사이즈 등)와 D3 시뮬레이션 훅을 연결한다.
 * - 입력: GraphData (nodes, links)
 * - 출력: 렌더된 SVG 및 제어 UI
 *
 * 주석 규칙: 파일 상단에 책임(한 문장), 주요 props 타입/의미를 적고,
 * 컴포넌트 내부 복잡한 로직에는 짧은 설명을 추가합니다.
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
  const nodeSelRef = useRef<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const linkSelRef = useRef<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>(null)
  const labelSelRef = useRef<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const [showMissing, setShowMissing] = useState(true)
  const showMissingRef = useRef<boolean>(true)

  const handleWrapperClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (!t) return
    if ((t.tagName && t.tagName.toLowerCase() === 'svg') || t.classList.contains('bg-rect')) {
      onBackgroundClick?.()
    }
  }
  const handleWrapperMouseDown = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (!t) return
    if ((t.tagName && t.tagName.toLowerCase() === 'svg') || t.classList.contains('bg-rect')) {
      onBackgroundClick?.()
    }
  }

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
    wrapRef,
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
    showMissingRef,
  })

  useEffect(() => {
    showMissingRef.current = showMissing
    const node = nodeSelRef.current
    const link = linkSelRef.current
    const label = labelSelRef.current
    if (node && link && label) {
      const missingSet = new Set<string>((data.nodes as GraphNode[]).filter((n) => n.missing).map((n) => n.id))
      node.style('display', (d: NodeDatum) => (!showMissing && d.missing ? 'none' : null))
      label.style('display', (d: NodeDatum) => (!showMissing && d.missing ? 'none' : null))
      link.style('display', (d: LinkDatum) => {
        const s = typeof d.source === 'string' ? d.source : d.source.id
        const t = typeof d.target === 'string' ? d.target : d.target.id
        return !showMissing && (missingSet.has(s) || missingSet.has(t)) ? 'none' : null
      })
    }
  }, [showMissing, data.nodes])

  return (
    <div ref={wrapRef} className="graph-wrap" onClick={handleWrapperClick} onMouseDown={handleWrapperMouseDown}>
      <svg ref={svgRef} role="img" aria-label="graph view" />

  <GraphControls showMissing={showMissing} onToggleShowMissing={() => setShowMissing((v) => !v)} />
    </div>
  )
}

export default memo(GraphView)
