import { useEffect } from 'react'
import * as d3 from 'd3'
import type { GraphNode } from '../types'
import type { RawLink } from '../lib/graphUtils'
import { colorNode, getMissingSet, mapLinksToNodes } from '../lib/graphUtils'

type NodeDatum = GraphNode & { x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null }
type LinkDatum = { source: string | NodeDatum; target: string | NodeDatum }

type Params = {
  svgRef: React.MutableRefObject<SVGSVGElement | null>
  wrapRef: React.MutableRefObject<HTMLDivElement | null>
  dims: { w: number; h: number }
  width: number
  height: number
  data: { nodes: GraphNode[]; links: RawLink[] }
  onNodeClick?: (node: { id: string; title: string; missing?: boolean }) => void
  onBackgroundClick?: () => void
  initializedRef: React.MutableRefObject<boolean>
  kickTimerRef: React.MutableRefObject<number | null>
  zoomRef: React.MutableRefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>
  simulationRef: React.MutableRefObject<d3.Simulation<NodeDatum, LinkDatum> | null>
  nodeSelRef: React.MutableRefObject<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>
  linkSelRef: React.MutableRefObject<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>
  labelSelRef: React.MutableRefObject<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>
  showMissingRef: React.MutableRefObject<boolean>
}

export default function useGraphSimulation(params: Params) {
  const {
    svgRef,
    dims,
    width,
    height,
    data,
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
  } = params

  useEffect(() => {
  const svg = d3.select(svgRef.current!)
  const W = dims.w || width
  const H = dims.h || height

    const kickSimulation = (sim: d3.Simulation<NodeDatum, LinkDatum> | null, target = 0.3, relaxTo = 0.05, relaxAfter = 1200) => {
      if (!sim) return
      try {
        sim.alpha(1)
        sim.alphaTarget(target)
        sim.restart()
        if (kickTimerRef.current) {
          window.clearTimeout(kickTimerRef.current)
          kickTimerRef.current = null
        }
        kickTimerRef.current = window.setTimeout(() => {
          try {
            sim.alphaTarget(relaxTo)
          } catch {
            // ignore
          }
          kickTimerRef.current = null
        }, relaxAfter)
      } catch {
        // ignore
      }
    }

    // Ensure root group and background exist
    let gRoot = svg.select<SVGGElement>('g.zoom-layer')
    if (gRoot.empty()) {
      svg.selectAll('*').remove()
      svg
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('height', '100%')
        .classed('graph-svg', true)

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
        .on('click', function (event) {
          event.stopPropagation()
          onBackgroundClick?.()
        })

      gRoot = svg.append('g').attr('class', 'zoom-layer').style('opacity', 1)
    }

  // link color (unused variable removed)

    const nodes: NodeDatum[] = data.nodes as NodeDatum[]
    const rawLinks: RawLink[] = data.links as RawLink[]
    const links: LinkDatum[] = mapLinksToNodes(nodes as GraphNode[], rawLinks) as LinkDatum[]

  // Groups: ensure groups exist (don't use `select(...) || append(...)` because select returns a Selection even when empty)
  let linkGroup = gRoot.select<SVGGElement>('g.links')
  if (linkGroup.empty()) linkGroup = gRoot.append('g').attr('class', 'links')
  let nodeGroup = gRoot.select<SVGGElement>('g.nodes')
  if (nodeGroup.empty()) nodeGroup = gRoot.append('g').attr('class', 'nodes')
  let labelGroup = gRoot.select<SVGGElement>('g.labels')
  if (labelGroup.empty()) labelGroup = gRoot.append('g').attr('class', 'labels')

    // Bind links with join (enter/update/exit) using simulation link objects when available
    type D3Link = d3.SimulationLinkDatum<NodeDatum>
    let linkDataForBind: D3Link[] | LinkDatum[] = links
    const existingLinkForce = simulationRef.current ? (simulationRef.current.force('link') as d3.ForceLink<NodeDatum, LinkDatum> | null) : null
    if (existingLinkForce && typeof existingLinkForce.links === 'function') {
      // Use the simulation's internal link objects so their source/target will be updated by the sim
      linkDataForBind = (existingLinkForce.links() as D3Link[])
    }

  const linkSel = linkGroup.selectAll<SVGLineElement, D3Link | LinkDatum>('line').data(linkDataForBind as LinkDatum[], (d: D3Link | LinkDatum) => {
      const s = typeof d.source === 'string' ? d.source : (d.source as NodeDatum).id
      const t = typeof d.target === 'string' ? d.target : (d.target as NodeDatum).id
      return `${s}::${t}`
    })
    linkSel.join(
  enter => enter.append('line').attr('class', 'link').style('opacity', 1).style('cursor', 'default'),
  update => update,
      exit => exit.remove()
    )
    linkSelRef.current = linkGroup.selectAll('line')

    // Bind nodes
  const nodeSel = nodeGroup.selectAll<SVGCircleElement, NodeDatum>('circle').data(nodes as NodeDatum[], (d: NodeDatum) => d.id)
    nodeSel.join(
      enter =>
        enter
          .append('circle')
          .attr('class', 'node')
          .attr('r', 8)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .attr('pointer-events', 'all')
          .style('opacity', 1)
          .on('click', (_evt, d) => {
            _evt.stopPropagation()
            if (!d.missing) onNodeClick?.({ id: d.id, title: d.title, missing: d.missing })
          })
          .call(sel =>
            sel.call(
              d3
                .drag<SVGCircleElement, NodeDatum>()
                .on('start', (event, d) => {
                  const se = (event as { sourceEvent?: Event } | undefined)?.sourceEvent
                  if (se && typeof (se as Event).stopPropagation === 'function') {
                    ;(se as Event).stopPropagation()
                  }
                  if (!event.active) kickSimulation(simulationRef.current, 0.3)
                  d.fx = d.x ?? null
                  d.fy = d.y ?? null
                })
                .on('drag', (event, d) => {
                  d.fx = event.x
                  d.fy = event.y
                })
                .on('end', (event, d) => {
                  if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0)
                  d.fx = null
                  d.fy = null
                })
            )
          ),
      update => update.attr('fill', d => colorNode(d.missing)),
      exit => exit.remove()
    )
    nodeSelRef.current = nodeGroup.selectAll('circle')

    // Bind labels
  const labelSel = labelGroup.selectAll<SVGTextElement, NodeDatum>('text').data(nodes as NodeDatum[], (d: NodeDatum) => d.id)
    labelSel.join(
      enter => enter.append('text').attr('class', 'label').attr('font-size', 11).attr('fill', '#c9d4e3').attr('stroke', 'none').attr('pointer-events', 'none').style('opacity', 1).style('font-family', 'Arial, sans-serif').text(d => d.title),
      update => update.text(d => d.title),
      exit => exit.remove()
    )
    labelSelRef.current = labelGroup.selectAll('text')

    // Simulation: if exists, update nodes/links; otherwise create
    if (simulationRef.current) {
      simulationRef.current.nodes(nodes)
      const linkForce = simulationRef.current.force('link') as d3.ForceLink<NodeDatum, LinkDatum>
  if (linkForce) linkForce.links(links)
      kickSimulation(simulationRef.current)
    } else {
      const simulation = d3
        .forceSimulation<NodeDatum>(nodes)
        .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id(d => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-180))
        .force('collision', d3.forceCollide<NodeDatum>().radius(18).strength(0.7))
        .force('x', d3.forceX(W / 2).strength(0.05))
        .force('y', d3.forceY(H / 2).strength(0.05))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .velocityDecay(0.6)
        .alpha(1)
        .alphaDecay(0.05)
      simulationRef.current = simulation

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .filter((event: unknown) => {
          const e = event as { type?: string; button?: number }
          const t = e.type
          if (t === 'wheel') return true
          if (t === 'mousedown') return e.button === 0
          if (t === 'mousemove' || t === 'mouseup') return true
          if (
            t === 'dblclick' ||
            t === 'touchstart' ||
            t === 'touchmove' ||
            t === 'touchend' ||
            t === 'gesturestart' ||
            t === 'gesturechange' ||
            t === 'gestureend'
          )
            return false
          return false
        })
        .on('zoom', event => {
          const tr = (event as d3.D3ZoomEvent<SVGSVGElement, unknown>).transform
          gRoot.attr('transform', `translate(${tr.x},${tr.y}) scale(${tr.k})`)
        })
        .on('start', event => {
          const se = (event as d3.D3ZoomEvent<SVGSVGElement, unknown>).sourceEvent as Event | undefined
          if (!se || !(se.target instanceof HTMLElement)) return
          const target = se.target as HTMLElement
          const isBg = target.classList.contains('bg-rect') || (target.tagName && target.tagName.toLowerCase() === 'svg')
          if (isBg) onBackgroundClick?.()
        })

      svg.on('dblclick.zoom', null)
      svg.call(zoom)
      zoomRef.current = zoom
      svg.call(zoom.transform, d3.zoomIdentity)

      let ticks = 0
      const didCenter = { current: false }

      const missingSet = getMissingSet(nodes as GraphNode[])

      const renderPositions = () => {
        const linkSel = linkSelRef.current
        const nodeSel = nodeSelRef.current
        const labelSel = labelSelRef.current
        if (!linkSel || !nodeSel || !labelSel) return

        linkSel
          .attr('x1', d => (typeof d.source === 'string' ? 0 : (d.source as NodeDatum).x ?? 0))
          .attr('y1', d => (typeof d.source === 'string' ? 0 : (d.source as NodeDatum).y ?? 0))
          .attr('x2', d => (typeof d.target === 'string' ? 0 : (d.target as NodeDatum).x ?? 0))
          .attr('y2', d => (typeof d.target === 'string' ? 0 : (d.target as NodeDatum).y ?? 0))

        nodeSel
          .attr('cx', d => {
            if (d.x === undefined) d.x = W / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.6
            return d.x ?? W / 2
          })
          .attr('cy', d => {
            if (d.y === undefined) d.y = H / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.6
            return d.y ?? H / 2
          })

        labelSel.attr('x', d => (d.x ?? W / 2) + 10).attr('y', d => (d.y ?? H / 2) + 4)

        ticks++
        if (!didCenter.current && ticks > 30) {
          const nx = nodes.map(n => n.x ?? 0)
          const ny = nodes.map(n => n.y ?? 0)
          const meanX = d3.mean(nx) ?? W / 2
          const meanY = d3.mean(ny) ?? H / 2
          const tx = W / 2 - meanX
          const ty = H / 2 - meanY
          const tr = d3.zoomIdentity.translate(tx, ty)
          svg.transition().duration(300).call(zoomRef.current!.transform, tr)
          didCenter.current = true
        }
      }

      simulationRef.current.on('tick', () => renderPositions())
      kickSimulation(simulationRef.current)
      renderPositions()

      let tickCount = 0
      const manualTick = () => {
        tickCount++
        renderPositions()
        if (tickCount < 100) setTimeout(manualTick, 16)
      }
      setTimeout(() => {
        if ((ticks as number) === 0) manualTick()
      }, 1000)

      initializedRef.current = true
      const updateVisibility = () => {
        const show = showMissingRef.current
        nodeSelRef.current?.style('display', (d: NodeDatum) => (!show && d.missing ? 'none' : null))
        labelSelRef.current?.style('display', (d: NodeDatum) => (!show && d.missing ? 'none' : null))
        linkSelRef.current?.style('display', (d: LinkDatum) => {
          const s = typeof d.source === 'string' ? d.source : d.source.id
          const t = typeof d.target === 'string' ? d.target : d.target.id
          return !show && (missingSet.has(s) || missingSet.has(t)) ? 'none' : null
        })
      }
      updateVisibility()

      return () => {
        simulationRef.current?.stop()
        simulationRef.current = null
        initializedRef.current = false
        nodeSelRef.current = null
        linkSelRef.current = null
        labelSelRef.current = null
        if (kickTimerRef.current) {
          window.clearTimeout(kickTimerRef.current)
          kickTimerRef.current = null
        }
      }
    }
    // Ensure we always clear any lingering simulation when the effect is torn down
    return () => {
      simulationRef.current?.stop()
      simulationRef.current = null
      initializedRef.current = false
      nodeSelRef.current = null
      linkSelRef.current = null
      labelSelRef.current = null
      if (kickTimerRef.current) {
        window.clearTimeout(kickTimerRef.current)
        kickTimerRef.current = null
      }
    }
  }, [svgRef, dims.w, dims.h, width, height, data, onNodeClick, onBackgroundClick, initializedRef, kickTimerRef, zoomRef, simulationRef, nodeSelRef, linkSelRef, labelSelRef, showMissingRef])
}
