/**
 * src/components/graph/GraphView.tsx
 * 책임: Graph SVG 렌더링 및 GraphControls 연결을 담당하는 UI 컴포넌트
 * 주요 props: data: GraphData, onNodeClick?, onBackgroundClick?
 * 한글 설명: D3 시뮬레이션 훅(`useGraphSimulation`)에 DOM refs를 전달합니다.
 */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import logger from '../../lib/logger'
import * as d3 from 'd3'
import type { GraphData, GraphNode } from '../../types'
import './GraphView.css'
import GraphControls from './GraphControls'
import useGraphSimulation from '../../hooks/useGraphSimulation'
import { GraphRefsProvider } from '../../hooks/GraphRefsContext'
import ErrorBoundary from '../ErrorBoundary'

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
  selectedNodeId?: string | null
}

const GraphView: React.FC<Props> = ({ data, width = 800, height = 520, onNodeClick, onBackgroundClick, selectedNodeId = null }) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: width, h: height })
  const initializedRef = useRef(false)
  const kickTimerRef = useRef<number | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const simulationRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null)
  // track whether simulation is currently stopped; initialize to false
  const simulationStoppedRef = useRef<boolean>(false)
  const nodeSelRef = useRef<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const linkSelRef = useRef<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>(null)
  const labelSelRef = useRef<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const [showMissing, setShowMissing] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const panInProgressRef = useRef<boolean | null>(false)

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

  // Pause simulation when the graph container is offscreen to save CPU
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl || typeof IntersectionObserver === 'undefined') return
    const simRefCurrent = simulationRef.current
    const observer = new IntersectionObserver(entries => {
      const e = entries[0]
      try {
        if (e && !e.isIntersecting) {
          // pause simulation and mark stopped so hover handlers are allowed
          try {
            simulationRef.current?.stop()
            simulationStoppedRef.current = true
          } catch (err) { logger.debug('GraphView: stop failed', err) }
        } else {
          try {
            if (simulationRef.current) {
              simulationRef.current.alpha(0.1).restart()
              simulationStoppedRef.current = false
            }
          } catch (err) { logger.debug('GraphView: restart failed', err) }
        }
      } catch (err) {
        logger.debug('GraphView: intersection handler failed', err)
      }
    }, { threshold: 0 })
    observer.observe(svgEl)
    return () => {
      try { simRefCurrent?.stop() } catch (err) { logger.debug('GraphView: cleanup stop failed', err) }
      try { observer.disconnect() } catch (err) { logger.debug('GraphView: observer disconnect failed', err) }
    }
  }, [svgRef, simulationRef])

  // provide refs via context to reduce prop drilling
  const refsValue = {
    initializedRef,
    kickTimerRef,
    zoomRef,
    simulationRef,
    nodeSelRef,
    linkSelRef,
    labelSelRef,
    simulationStoppedRef,
  panInProgressRef,
  }

  const [lastClickedNodeId, setLastClickedNodeId] = useState<string | null>(null)

  // wrap onNodeClick so we can react locally (vertical panning) while still
  // forwarding to consumer handlers
  const forwardedOnNodeClick = useCallback((node: { id: string; title: string; missing?: boolean }) => {
    try { setLastClickedNodeId(node.id) } catch (e) { logger.debug('GraphView: setLastClickedNodeId failed', e) }
    try { onNodeClick?.(node) } catch (e) { logger.debug('GraphView: forwarded onNodeClick failed', e) }
  }, [onNodeClick])

  const simControls = useGraphSimulation({
    svgRef,
    dims,
    width,
    height,
    data: { nodes: data.nodes, links: data.links },
    onNodeClick: forwardedOnNodeClick,
    onBackgroundClick,
  showMissing,
  providedRefs: refsValue,
  selectedNodeId,
  })

  // When a node is clicked, pan vertically so the node is centered vertically
  useEffect(() => {
    if (!lastClickedNodeId) return
    const svgEl = svgRef.current
    const z = zoomRef.current
    const nodeSel = nodeSelRef.current
    if (!svgEl || !z || !nodeSel) return

    try {
      // Prefer using the node's actual screen position (DOM) to avoid
      // discrepancies between the simulation's datum and rendered pixel position
      const sel = nodeSel.filter((nd: NodeDatum) => nd.id === lastClickedNodeId)
      if (!sel || typeof sel.node !== 'function' || !sel.node()) return
      const nodeEl = sel.node() as SVGCircleElement
      const nodeRect = nodeEl.getBoundingClientRect()
      if (!nodeRect) return

      const svg = d3.select(svgEl)
      const cur = d3.zoomTransform(svg.node() as SVGSVGElement)
      const k = cur.k || 1

      // compute how many screen pixels we need to move the current transform
      // so the node's visual center is at the center of the left half screen
      // (considering insight drawer takes right 50vw when open)
      const nodeScreenX = nodeRect.left + nodeRect.width / 2
      const nodeScreenY = nodeRect.top + nodeRect.height / 2
      
      // Target: center of left half of viewport
      // Left half width = 50vw when drawer is open, so center is at 25vw from left
      const viewportWidth = (typeof window !== 'undefined' && typeof window.innerWidth === 'number') ? window.innerWidth : 800
      const viewportHeight = (typeof window !== 'undefined' && typeof window.innerHeight === 'number') ? window.innerHeight : 600
      const leftHalfCenterX = viewportWidth * 0.25  // 25% from left (center of left half)
      const leftHalfCenterY = viewportHeight * 0.5   // 50% from top (vertical center)

      // delta in screen pixels to move node to left half center
      const deltaScreenX = leftHalfCenterX - nodeScreenX
      const deltaScreenY = leftHalfCenterY - nodeScreenY

      // applying translate by delta to current transform will shift the node accordingly
      const tx = cur.x + deltaScreenX
      const ty = cur.y + deltaScreenY
      const target = d3.zoomIdentity.translate(tx, ty).scale(k)

      try {
        // mark pan in progress to suppress pointer/hover noise
        try {
          panInProgressRef.current = true
        } catch (err) {
          logger.debug('GraphView: failed to mark panInProgress start', err)
        }

        const maybeTransform = (zoomRef.current as unknown as { transform?: (sel: unknown, t: d3.ZoomTransform) => void }).transform
        if (typeof maybeTransform === 'function') {
          svg.transition()
            .duration(400)
            .call(maybeTransform as unknown as (transition: d3.Transition<SVGSVGElement, unknown, null, undefined>, t: d3.ZoomTransform) => void, target)
            .on('end interrupt', () => {
              try { panInProgressRef.current = false } catch (err) { logger.debug('GraphView: failed to clear panInProgress', err) }
            })
        } else {
          const g = svg.select<SVGGElement>('g.zoom-layer')
          g.transition()
            .duration(400)
            .attr('transform', `translate(${tx},${ty}) scale(${k})`)
            .on('end interrupt', () => {
              try { panInProgressRef.current = false } catch (err) { logger.debug('GraphView: failed to clear panInProgress', err) }
            })
        }
      } catch (e) {
  try { panInProgressRef.current = false } catch (err) { logger.debug('GraphView: failed to clear panInProgress on error', err) }
        logger.debug('GraphView: vertical pan failed', e)
      }
    } catch (e) {
      logger.debug('GraphView: vertical pan setup failed', e)
    }
  }, [lastClickedNodeId, dims.h, height, panInProgressRef])

  useEffect(() => {
    // detect prefers-reduced-motion and reflect in local state
    try {
      if (typeof window !== 'undefined' && 'matchMedia' in window) {
        const mq: MediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(!!mq.matches)
        const handler = (ev: MediaQueryListEvent) => setPrefersReducedMotion(!!ev.matches)
        // newer browsers support addEventListener
        if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handler)
        else {
          // legacy browsers implement addListener/removeListener on MediaQueryList
          type LegacyMQL = MediaQueryList & {
            addListener?: (l: (e: MediaQueryListEvent) => void) => void
            removeListener?: (l: (e: MediaQueryListEvent) => void) => void
          }
          const lmq = mq as LegacyMQL
          if (typeof lmq.addListener === 'function') lmq.addListener(handler)
        }
        return () => {
          if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', handler)
          else {
            const lmq = mq as MediaQueryList & { removeListener?: (l: (e: MediaQueryListEvent) => void) => void }
            if (typeof lmq.removeListener === 'function') lmq.removeListener(handler)
          }
        }
      }
    } catch (err) {
      logger.debug('GraphView: mq setup failed', err)
    }
  }, [])

  // ensure simulation is paused on unmount or when pref change requires it
  useEffect(() => {
    if (prefersReducedMotion) {
      try { simControls.pauseSimulation?.() } catch (err) { logger.debug('GraphView: pauseSimulation failed', err) }
    }
    return () => {
      try { simControls.pauseSimulation?.() } catch (err) { logger.debug('GraphView: cleanup pauseSimulation failed', err) }
    }
  }, [prefersReducedMotion, simControls])

  // focus panning removed: previous implementation caused coordinate mismatches.
  // Re-implementation note: compute an absolute viewport target (window or modal-centered),
  // convert that into SVG-local coordinates, and call the d3 zoom behavior's transform method.


  return (
    <ErrorBoundary>
      <GraphRefsProvider value={refsValue}>
        <div ref={wrapRef} className="graph-wrap">
          <svg ref={svgRef} role="img" aria-label="graph view" />

          <GraphControls showMissing={showMissing} onToggleShowMissing={useCallback(() => setShowMissing((v) => !v), [])} />
        </div>
      </GraphRefsProvider>
    </ErrorBoundary>
  )
}

export default memo(GraphView)
