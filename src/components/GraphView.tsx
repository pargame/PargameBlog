import React, { memo, useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { GraphData, GraphNode } from '../types'
import './GraphView.css'

/*
  GraphView.tsx

  Purpose:
  - Render an interactive force-directed graph using d3 within a React component.
  - Provide zoom/pan, node dragging, hover highlighting, and a visibility toggle for "missing" nodes.

  Contract (high-level):
  - Inputs: `data: GraphData` (nodes: GraphNode[], links: { source, target }[]), optional width/height.
  - Outputs: visually-updated SVG positions for nodes/links/labels; callbacks onNodeClick and onBackgroundClick.
  - Side effects: attaches D3 simulation and DOM listeners; cleans up simulation on unmount.

  Success criteria:
  - Nodes and links are positioned by the physics simulation and updated into the DOM on each tick.
  - When the modal (or container) size changes, the simulation is restarted/kicked so layout reflows correctly.
  - Dragging a node fixes its position during drag and restarts the simulation to provide consistent tactile feedback.

  Notes:
  - The simulation may receive links with string ids; those are mapped to node objects when possible.
  - A short "relax" timer is used after kicking the sim to lower alphaTarget and allow the layout to settle.
*/

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

  // The wrapper click/mousedown handlers are thin adapters so clicks on the
  // empty graph background (or the SVG itself) are treated as background
  // interactions. This lets parent components close the modal or clear
  // selection when the user clicks away from nodes.

  // Resize observer to make the graph fill available space
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

  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    const W = dims.w || width
    const H = dims.h || height

    // Helper to consistently kick/restart the simulation. Use this both when
    // the modal first opens and when a user starts dragging a node so the
    // simulation behavior is identical.
    const kickSimulation = (sim: d3.Simulation<NodeDatum, LinkDatum> | null, target = 0.3, relaxTo = 0.05, relaxAfter = 1200) => {
      if (!sim) return
      try {
        // start energetic phase
        sim.alpha(1)
        sim.alphaTarget(target)
        sim.restart()

        // clear any previous timer
        if (kickTimerRef.current) {
          window.clearTimeout(kickTimerRef.current)
          kickTimerRef.current = null
        }

        // after a short period, reduce alphaTarget to allow damping / settling
        kickTimerRef.current = window.setTimeout(() => {
          try {
            sim.alphaTarget(relaxTo)
          } catch {
            // ignore
          }
          kickTimerRef.current = null
        }, relaxAfter)
      } catch {
        // Defensive: ignore if simulation already stopped
      }
    }

    if (!initializedRef.current) {
      svg.selectAll('*').remove()
      svg
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('height', '100%')
        .classed('graph-svg', true)
  // debug removed

  // Background rect should be inserted first so it sits behind nodes and
  // captures empty-area clicks while allowing node events to receive pointer events.
      svg
        .insert('rect', ':first-child')
        .attr('class', 'bg-rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', W)
        .attr('height', H)
        .attr('fill', 'transparent')
        .attr('pointer-events', 'all')
        .style('cursor', 'default')
        .on('click', function(event) {
          event.stopPropagation()
          onBackgroundClick?.()
        })

      // Root group that will be transformed by zoom/pan. All nodes/links/labels
      // are appended inside this so a single transform handles panning and zoom.
      const gRoot = svg
        .append('g')
        .attr('class', 'zoom-layer')
        .style('opacity', 1)
      // Simple color helpers for node and link styling; missing nodes use a
      // distinct color to make them visually identifiable.
      const colorNode = (missing?: boolean) => (missing ? '#ff8a8a' : '#9db9ff')
      const colorLink = '#63708a'

      const nodes: NodeDatum[] = data.nodes as NodeDatum[]
      const rawLinks: LinkDatum[] = data.links as unknown as LinkDatum[]
      const idToNode = new Map<string, NodeDatum>(nodes.map(n => [n.id, n]))
      // Convert raw link endpoints (which may be strings) into node object
      // references when possible. Leaving a string in place is tolerated by
      // later rendering code (it falls back to coords 0/0), but mapping is
      // preferred so the link force can operate on object references.
      const links: LinkDatum[] = rawLinks.map(l => ({
        source: (typeof l.source === 'string' ? (idToNode.get(l.source) ?? l.source) : l.source),
        target: (typeof l.target === 'string' ? (idToNode.get(l.target) ?? l.target) : l.target),
      }))

  // debug removed

  // Build adjacency map for fast neighbor lookup during hover. This map
  // lets hover handlers quickly decide which nodes/links should be
  // highlighted vs faded without expensive graph traversals.
      const adjacency = new Map<string, Set<string>>()
      nodes.forEach(n => adjacency.set(n.id, new Set([n.id])))
      links.forEach(l => {
        const s = typeof l.source === 'string' ? l.source : l.source.id
        const t = typeof l.target === 'string' ? l.target : l.target.id
        if (!adjacency.has(s)) adjacency.set(s, new Set())
        if (!adjacency.has(t)) adjacency.set(t, new Set())
        adjacency.get(s)!.add(t)
        adjacency.get(t)!.add(s)
      })
  // debug removed

  // Create and configure the force simulation. The chosen forces:
  // - link: tries to keep linked nodes at a fixed distance
  // - charge: repels nodes to avoid clumping
  // - collision: prevents visual overlap using a collision radius
  // - x/y/center: softly bias nodes toward the viewport center
  // velocityDecay controls damping; a larger value damps motion faster.
  const simulation = d3
        .forceSimulation<NodeDatum>(nodes)
        .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id((d) => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-180))
        .force('collision', d3.forceCollide<NodeDatum>().radius(18).strength(0.7))
        .force('x', d3.forceX(W / 2).strength(0.05))
        .force('y', d3.forceY(H / 2).strength(0.05))
        .force('center', d3.forceCenter(W / 2, H / 2))
        // increased damping to avoid overshoot; previous regression removed damping feel
        .velocityDecay(0.6)
        .alpha(1)
        .alphaDecay(0.05)
  simulationRef.current = simulation



      // Link elements: simple stroked lines. They don't receive pointer
      // events so clicks/hover pass through to nodes unless intercepted.
      const link = gRoot
        .append('g')
        .attr('stroke', colorLink)
        .attr('stroke-opacity', 0.6)
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', 1.5)
        .style('opacity', 1)
        // no pointer on edges
        .style('cursor', 'default')
      linkSelRef.current = link
  // debug removed

      // Node elements: circles that accept pointer events and respond to
      // click and drag. Clicking stops propagation so the background handler
      // doesn't close the modal. Dragging sets fx/fy so the simulation treats
      // the node as fixed during the drag; releasing clears fx/fy.
      const node = gRoot
        .append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', 8)
        .attr('fill', (d) => colorNode(d.missing))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .attr('pointer-events', 'all')
        .style('opacity', 1)
        .on('click', (_evt, d) => {
          _evt.stopPropagation()
          if (!d.missing) onNodeClick?.({ id: d.id, title: d.title, missing: d.missing })
        })
        .call(
          d3
            .drag<SVGCircleElement, NodeDatum>()
            .on('start', (event, d) => {
              const se = (event as unknown as { sourceEvent?: Event }).sourceEvent
              if (se && typeof (se as Event).stopPropagation === 'function') {
                ;(se as Event).stopPropagation()
              }
              // Kick the sim consistently when dragging starts so the
              // user's dragging action produces consistent physics feedback.
              if (!event.active) kickSimulation(simulation, 0.3)
              d.fx = d.x ?? null
              d.fy = d.y ?? null
            })
            .on('drag', (event, d) => {
              // Keep the node fixed to the pointer while dragging
              d.fx = event.x
              d.fy = event.y
            })
            .on('end', (event, d) => {
              // Release the node back to the simulation. If nothing else is
              // active, lower the alphaTarget so the system can settle.
              if (!event.active) simulation.alphaTarget(0)
              d.fx = null
              d.fy = null
            })
        )
      nodeSelRef.current = node

      // Labels are simple text elements positioned near nodes. They don't
      // participate in pointer events to keep hover behavior focused on
      // the nodes themselves.
      const label = gRoot
        .append('g')
        .selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .attr('class', 'label')
        .text((d) => d.title)
        .attr('font-size', 11)
        .attr('fill', '#c9d4e3')
        .attr('stroke', 'none')
        .attr('pointer-events', 'none')
        .style('opacity', 1)
        .style('font-family', 'Arial, sans-serif')
      labelSelRef.current = label

      // Zoom/Pan
  // Zoom behavior: allow wheel and left-mouse drag to pan/zoom. Touch and
  // gesture events are disabled to avoid unexpected behavior on mobile.
  const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .filter((event: unknown) => {
          const e = event as { type?: string; button?: number }
          const t = e.type
          if (t === 'wheel') return true
          if (t === 'mousedown') return e.button === 0
          if (t === 'mousemove' || t === 'mouseup') return true
          if (t === 'dblclick' || t === 'touchstart' || t === 'touchmove' || t === 'touchend' || t === 'gesturestart' || t === 'gesturechange' || t === 'gestureend') return false
          return false
        })
        .on('zoom', (event) => {
          const tr = (event as d3.D3ZoomEvent<SVGSVGElement, unknown>).transform
          gRoot.attr('transform', `translate(${tr.x},${tr.y}) scale(${tr.k})`)
        })
  .on('start', (event) => {
          // Only close the insight panel when a zoom/pan begins on the empty background
          // (not when starting drag on a node). The zoom sourceEvent tells us the original DOM event.
          const se = (event as d3.D3ZoomEvent<SVGSVGElement, unknown>).sourceEvent as Event | undefined
          if (!se || !(se.target instanceof HTMLElement)) return
          const target = se.target as HTMLElement
          const isBg = target.classList.contains('bg-rect') || (target.tagName && target.tagName.toLowerCase() === 'svg')
          // debug removed
          if (isBg) onBackgroundClick?.()
        })

      svg.on('dblclick.zoom', null)
      svg.call(zoom)
      zoomRef.current = zoom
      svg.call(zoom.transform, d3.zoomIdentity)

  // Track ticks to know when the simulation has progressed enough to
  // perform a one-time centering transform that improves initial layout.
  let ticks = 0
  const didCenter = { current: false }

      const missingSet = new Set<string>(nodes.filter((n) => n.missing).map((n) => n.id))

      // Lightweight JS hover handlers: attach both mouseenter and pointerenter
      // for broader browser compatibility. Use shared handler to avoid
      // duplicate logic. Similarly attach mouseleave and pointerleave.
      const handleHoverEnter = (_evt: unknown, d: NodeDatum) => {
  // hover log removed
        const related = adjacency.get(d.id) ?? new Set<string>([d.id])

        // Nodes: use native classList for slightly better perf / predictability
        const nodeEls = nodeSelRef.current?.nodes?.() ?? []
        nodeEls.forEach((el: Element) => {
          const ndDatum = (el as unknown as { __data__?: unknown }).__data__
          const nd: NodeDatum | undefined = typeof ndDatum === 'object' && ndDatum !== null ? (ndDatum as NodeDatum) : undefined
          if (!nd) return
          if (related.has(nd.id)) {
            el.classList.add('active')
            el.classList.remove('faded')
          } else {
            el.classList.add('faded')
            el.classList.remove('active')
          }
        })

        // Labels
        const labelEls = labelSelRef.current?.nodes?.() ?? []
        labelEls.forEach((el: Element) => {
          const ndDatum = (el as unknown as { __data__?: unknown }).__data__
          const nd: NodeDatum | undefined = typeof ndDatum === 'object' && ndDatum !== null ? (ndDatum as NodeDatum) : undefined
          if (!nd) return
          if (related.has(nd.id)) {
            el.classList.add('active')
            el.classList.remove('faded')
          } else {
            el.classList.add('faded')
            el.classList.remove('active')
          }
        })

        // Links
        const linkEls = linkSelRef.current?.nodes?.() ?? []
        linkEls.forEach((el: Element) => {
          const lkDatum = (el as unknown as { __data__?: unknown }).__data__
          if (!lkDatum || typeof lkDatum !== 'object') return
          const lk = lkDatum as { source: string | NodeDatum; target: string | NodeDatum }
          const s = typeof lk.source === 'string' ? lk.source : lk.source.id
          const t = typeof lk.target === 'string' ? lk.target : lk.target.id
          if (related.has(s) && related.has(t)) {
            el.classList.add('active')
            el.classList.remove('faded-link')
          } else {
            el.classList.add('faded-link')
            el.classList.remove('active')
          }
        })
      }

      const handleHoverLeave = () => {
        // hover log removed
        const nodeEls = nodeSelRef.current?.nodes?.() ?? []
        nodeEls.forEach((el: Element) => el.classList.remove('faded', 'active'))
        const labelEls = labelSelRef.current?.nodes?.() ?? []
        labelEls.forEach((el: Element) => el.classList.remove('faded', 'active'))
        const linkEls = linkSelRef.current?.nodes?.() ?? []
        linkEls.forEach((el: Element) => el.classList.remove('faded-link', 'active'))
      }

      node.on('mouseenter', handleHoverEnter).on('pointerenter', handleHoverEnter)
      node.on('mouseleave', handleHoverLeave).on('pointerleave', handleHoverLeave)

  // (debug pointermove listener removed)

      const updateVisibility = () => {
        const show = showMissingRef.current
        node.style('display', (d) => (!show && d.missing ? 'none' : null))
        label.style('display', (d) => (!show && d.missing ? 'none' : null))
        link.style('display', (d) => {
          const s = typeof d.source === 'string' ? d.source : d.source.id
          const t = typeof d.target === 'string' ? d.target : d.target.id
          return !show && (missingSet.has(s) || missingSet.has(t)) ? 'none' : null
        })
      }

  // renderPositions: called on every simulation tick (and also during
  // manual fallback). Updates link endpoints, node circle positions, and
  // label positions based on the simulation's x/y values.
  const renderPositions = () => {
        const linkSel = linkSelRef.current
        const nodeSel = nodeSelRef.current
        const labelSel = labelSelRef.current
        if (!linkSel || !nodeSel || !labelSel) return

        linkSel
          .attr('x1', (d) => (typeof d.source === 'string' ? 0 : (d.source.x ?? 0)))
          .attr('y1', (d) => (typeof d.source === 'string' ? 0 : (d.source.y ?? 0)))
          .attr('x2', (d) => (typeof d.target === 'string' ? 0 : (d.target.x ?? 0)))
          .attr('y2', (d) => (typeof d.target === 'string' ? 0 : (d.target.y ?? 0)))

        nodeSel
          .attr('cx', (d) => {
            if (d.x === undefined) d.x = W / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.6
            return d.x ?? W / 2
          })
          .attr('cy', (d) => {
            if (d.y === undefined) d.y = H / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.6
            return d.y ?? H / 2
          })

        labelSel.attr('x', (d) => (d.x ?? W / 2) + 10).attr('y', (d) => (d.y ?? H / 2) + 4)

  // center adjust after ticks: once nodes have moved a bit, compute the
  // mean position and pan the viewport so the graph is centered.
        ticks++
        if (!didCenter.current && ticks > 30) {
          const nx = nodes.map((n) => n.x ?? 0)
          const ny = nodes.map((n) => n.y ?? 0)
          const meanX = d3.mean(nx) ?? W / 2
          const meanY = d3.mean(ny) ?? H / 2
          const tx = W / 2 - meanX
          const ty = H / 2 - meanY
          const tr = d3.zoomIdentity.translate(tx, ty)
          svg.transition().duration(300).call(zoomRef.current!.transform, tr)
          didCenter.current = true
        }
      }

      simulation.on('tick', () => renderPositions())

  // Kick the simulation once on init so positions start converging
  kickSimulation(simulation, 0.3)
      renderPositions()

  // manual tick fallback: some environments may not run RAF-driven ticks
  // reliably right away; if the main tick counter hasn't incremented,
  // attempt a few manual renders to ensure the UI shows something.
      let tickCount = 0
      const manualTick = () => {
        tickCount++
        renderPositions()
        if (tickCount < 100) setTimeout(manualTick, 16)
      }
      setTimeout(() => {
        if (ticks === 0) manualTick()
      }, 1000)

      initializedRef.current = true

      // initial visibility
      updateVisibility()

  // (debug badge removed)

  return () => {
        simulation.stop()
        if (kickTimerRef.current) {
          window.clearTimeout(kickTimerRef.current)
          kickTimerRef.current = null
        }
      }
    }

    // Update-only path
    svg.attr('viewBox', `0 0 ${W} ${H}`)
    svg.select('rect.bg-rect').attr('width', W).attr('height', H)
    // If already initialized, ensure simulation restarts on resize/dims change
    if (initializedRef.current) {
      kickSimulation(simulationRef.current, 0.3)
    }
  }, [dims.w, dims.h, width, height, data, onNodeClick, onBackgroundClick])

  useEffect(() => {
    showMissingRef.current = showMissing
    const node = nodeSelRef.current
    const link = linkSelRef.current
    const label = labelSelRef.current
    if (node && link && label) {
      const missingSet = new Set<string>((data.nodes as GraphNode[]).filter((n) => n.missing).map((n) => n.id))
      node.style('display', (d) => (!showMissing && d.missing ? 'none' : null))
      label.style('display', (d) => (!showMissing && d.missing ? 'none' : null))
      link.style('display', (d) => {
        const s = typeof d.source === 'string' ? d.source : d.source.id
        const t = typeof d.target === 'string' ? d.target : d.target.id
        return !showMissing && (missingSet.has(s) || missingSet.has(t)) ? 'none' : null
      })
    }
  }, [showMissing, data.nodes])

  return (
    <div ref={wrapRef} className="graph-wrap" onClick={handleWrapperClick} onMouseDown={handleWrapperMouseDown}>
      <svg ref={svgRef} role="img" aria-label="graph view" />

      <div className="graph-controls">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showMissing}
            onChange={() => setShowMissing((v) => !v)}
            style={{ cursor: 'pointer' }}
          />
          Include Missings
        </label>
      </div>
    </div>
  )
}

export default memo(GraphView)
