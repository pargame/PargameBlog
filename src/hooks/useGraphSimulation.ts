import { useCallback, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import logger from '../lib/logger'
import type { RefHandle } from './types'
import type { GraphNode } from '../types'
import type { LinkDatum, NodeDatum } from './types'

type Params = {
  svgRef: RefHandle<SVGSVGElement | null>
  dims: { w: number; h: number }
  width: number
  height: number
  data: { nodes: GraphNode[]; links: LinkDatum[] }
  onNodeClick?: (node: { id: string; title: string; missing?: boolean }) => void
  onBackgroundClick?: () => void
  providedRefs?: import('./types').GraphRefs | undefined
  showMissing?: boolean
  selectedNodeId?: string | null
}

// Minimal, standards-aligned simulation hook conforming to 그래프요구사항.md.
// Intent: simple, well-typed, easy to audit and maintain.
export default function useGraphSimulation(params: Params) {
  const { svgRef, dims, width, height, data, onNodeClick, onBackgroundClick } = params

  const simulationRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null)
  const nodeSelRef = useRef<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const linkSelRef = useRef<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>(null)
  const labelSelRef = useRef<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const kickTimerRef = useRef<number | null>(null)

  const prefersReducedMotion = typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  // Tunable thresholds (kept intentionally simple and local)
  const NODE_SPEED_THRESHOLD = 0.5
  const IDLE_TICKS_TO_STOP = 5
  const NODE_IDLE_RATIO = 0.9

  const KICK_ALPHA_TARGET = 0.3
  const KICK_RELAX_TO = 0.05
  const KICK_RELAX_AFTER_MS = 1200

  const renderPositions = useCallback(() => {
    const l = linkSelRef.current
    const n = nodeSelRef.current
    const t = labelSelRef.current
    if (!l || !n || !t) return
    l
      .attr('x1', d => (typeof d.source === 'string' ? 0 : (d.source as NodeDatum).x ?? 0))
      .attr('y1', d => (typeof d.source === 'string' ? 0 : (d.source as NodeDatum).y ?? 0))
      .attr('x2', d => (typeof d.target === 'string' ? 0 : (d.target as NodeDatum).x ?? 0))
      .attr('y2', d => (typeof d.target === 'string' ? 0 : (d.target as NodeDatum).y ?? 0))
    n.attr('cx', d => d.x ?? dims.w / 2).attr('cy', d => d.y ?? dims.h / 2)
    t.attr('x', d => (d.x ?? dims.w / 2) + 10).attr('y', d => (d.y ?? dims.h / 2) + 4)
  }, [dims.w, dims.h])

  const kickSimulation = useCallback((sim: d3.Simulation<NodeDatum, LinkDatum> | null) => {
    if (!sim) return
    try {
      // unpin auto-pinned nodes
      const nodes = sim.nodes() as NodeDatum[]
      for (const nd of nodes) {
        if (nd._autoPinned) {
          nd.fx = null
          nd.fy = null
          nd._autoPinned = false
        }
      }
      sim.alpha(1)
      sim.alphaTarget(KICK_ALPHA_TARGET)
      sim.restart()
      if (kickTimerRef.current) { window.clearTimeout(kickTimerRef.current); kickTimerRef.current = null }
      kickTimerRef.current = window.setTimeout(() => {
        try { sim.alphaTarget(KICK_RELAX_TO) } catch (e) { logger.debug('kick simulation relax failed', e) }
        kickTimerRef.current = null
      }, KICK_RELAX_AFTER_MS)
    } catch (e) {
      logger.debug('kickSimulation failed', e)
    }
  }, [])

  const pauseSimulation = useCallback(() => {
    try { simulationRef.current?.stop() } catch (e) { logger.debug('pauseSimulation failed', e) }
  }, [])

  const resumeSimulation = useCallback(() => {
    try { simulationRef.current?.restart() } catch (e) { logger.debug('resumeSimulation failed', e) }
  }, [])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const svg = d3.select(svgEl)
    const W = dims.w || width
    const H = dims.h || height

    // create container groups if missing
    let g = svg.select<SVGGElement>('g.zoom-layer')
    if (g.empty()) {
      svg.selectAll('*').remove()
      svg.attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet')
      svg.insert('rect', ':first-child').attr('class', 'bg-rect').attr('x', 0).attr('y', 0).attr('width', W).attr('height', H).attr('fill', 'transparent')
      g = svg.append('g').attr('class', 'zoom-layer')
    }

    const nodes = data.nodes as NodeDatum[]
    const links = data.links as LinkDatum[]

    // join elements
    let linkGroup = g.select<SVGGElement>('g.links')
    if (linkGroup.empty()) linkGroup = g.append('g').attr('class', 'links')
    let nodeGroup = g.select<SVGGElement>('g.nodes')
    if (nodeGroup.empty()) nodeGroup = g.append('g').attr('class', 'nodes')
    let labelGroup = g.select<SVGGElement>('g.labels')
    if (labelGroup.empty()) labelGroup = g.append('g').attr('class', 'labels')

    const linkSel = linkGroup.selectAll('line').data(links)
    linkSel.join(enter => enter.append('line').attr('class', 'link'), update => update, exit => exit.remove())
    linkSelRef.current = linkGroup.selectAll('line')

    const nodeSel = nodeGroup.selectAll('circle').data(nodes)
    nodeSel.join(enter => enter.append('circle').attr('class', d => `node${d.missing ? ' missing' : ''}`).attr('r', 8).attr('fill', '#2563eb').attr('pointer-events', 'all')
      .on('click', (ev, d) => { ev.stopPropagation(); if (!d.missing) onNodeClick?.({ id: d.id, title: d.title, missing: d.missing }) }),
      update => update, exit => exit.remove())
    nodeSelRef.current = nodeGroup.selectAll('circle')

    const labelSel = labelGroup.selectAll('text').data(nodes)
    labelSel.join(enter => enter.append('text').attr('class', 'label').attr('font-size', 11).attr('fill', '#c9d4e3').attr('pointer-events', 'none').text(d => d.title), update => update.text(d => d.title), exit => exit.remove())
    labelSelRef.current = labelGroup.selectAll('text')

    // simple simulation
    const sim = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('collision', d3.forceCollide<NodeDatum>().radius(18).strength(0.7))
      .force('x', d3.forceX(W / 2).strength(0.05))
      .force('y', d3.forceY(H / 2).strength(0.05))
      .velocityDecay(0.6)
      .alpha(1)
      .alphaDecay(0.05)

    simulationRef.current = sim

    sim.on('tick', () => {
      try { renderPositions() } catch (e) { logger.debug('renderPositions failed', e) }
      try {
        const cur = sim.nodes() as NodeDatum[]
        let autoPinned = 0
        let dragging = 0
        for (const n of cur) {
          n._idleTicks = (n._idleTicks ?? 0)
          n._autoPinned = !!n._autoPinned
          if (n._dragging) dragging++
          const s = Math.sqrt((n.vx ?? 0) ** 2 + (n.vy ?? 0) ** 2)
          if (s < NODE_SPEED_THRESHOLD) n._idleTicks = (n._idleTicks ?? 0) + 1
          else n._idleTicks = 0
          if (!n._autoPinned && !n._dragging && (n._idleTicks ?? 0) >= IDLE_TICKS_TO_STOP) {
            try { n.vx = 0; n.vy = 0; n.fx = n.x ?? null; n.fy = n.y ?? null } catch (e) { logger.debug('pin failed', e) }
            n._autoPinned = true
          }
          if (n._autoPinned) autoPinned++
        }
        const ratio = cur.length > 0 ? autoPinned / cur.length : 1
        if (ratio >= NODE_IDLE_RATIO && dragging === 0) {
          try { sim.stop() } catch (e) { logger.debug('sim stop failed', e) }
        }
      } catch (e) { logger.debug('tick handler failed', e) }
    })

    // basic drag
    try {
      nodeSelRef.current?.call(
        d3.drag<SVGCircleElement, NodeDatum>()
          .on('start', (_ev, d) => { d._dragging = true; d.fx = d.x ?? null; d.fy = d.y ?? null })
          .on('drag', (ev, d) => { const e = ev as unknown as { x: number; y: number }; d.fx = e.x; d.fy = e.y; kickSimulation(sim) })
          .on('end', (_ev, d) => { d._dragging = false; d.fx = null; d.fy = null })
      )
    } catch (e) { logger.debug('drag setup failed', e) }

    try { svg.select<SVGRectElement>('.bg-rect').on('click', (ev) => { ev.stopPropagation(); onBackgroundClick?.() }) } catch (e) { logger.debug('bg handler failed', e) }

    if (!prefersReducedMotion) kickSimulation(sim)

    return () => {
      try { sim.stop() } catch (e) { logger.debug('cleanup sim stop failed', e) }
      try { nodeSelRef.current = null } catch (e) { logger.debug('cleanup nodeSel clear failed', e) }
      try { linkSelRef.current = null } catch (e) { logger.debug('cleanup linkSel clear failed', e) }
      try { labelSelRef.current = null } catch (e) { logger.debug('cleanup labelSel clear failed', e) }
      try { simulationRef.current = null } catch (e) { logger.debug('cleanup simRef clear failed', e) }
      if (kickTimerRef.current) { window.clearTimeout(kickTimerRef.current); kickTimerRef.current = null }
    }
  }, [svgRef, dims.w, dims.h, width, height, data, onNodeClick, onBackgroundClick, kickSimulation, renderPositions, prefersReducedMotion])

  return { kickSimulation, pauseSimulation, resumeSimulation, prefersReducedMotion }
}
