import { useEffect } from 'react'
import * as d3 from 'd3'
import type { InteractionParams, LinkDatum, NodeDatum } from './types'
import logger from '../lib/logger'
import { DRAG_PIXEL_THRESHOLD } from './graphConstants'

export default function useGraphInteraction(params: InteractionParams) {
  const { svgRef, zoomRef, simulationRef, nodeSelRef, linkSelRef, labelSelRef, onBackgroundClick, kickSimulation, simulationStoppedRef, panInProgressRef } = params

  useEffect(() => {
  const svg = d3.select(svgRef.current!)
  const gRoot = svg.select<SVGGElement>('g.zoom-layer')
  if (gRoot.empty()) return

  // capture current selections for use in the cleanup function to avoid
  // referencing mutable refs from the cleanup closure (react-hooks/exhaustive-deps)
  const _nodesForCleanup = nodeSelRef.current
  // handlers declared here so cleanup can reference them
  let handleSimStopped: (() => void) | null = null
  let handleSimStarted: (() => void) | null = null

  try {
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .filter((e: unknown) => {
          const ev = e as Event & { type?: string; button?: number }
          const t = ev && ev.type
          if (t === 'wheel') return true
          if (t === 'mousedown') return ev.button === 0
          return t === 'mousemove' || t === 'mouseup'
        })
        .on('zoom', (ev: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          const tr = ev.transform
          gRoot.attr('transform', `translate(${tr.x},${tr.y}) scale(${tr.k})`)
        })
        .on('start', (ev: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          const se = ev.sourceEvent as Event | undefined
          if (!se || !(se.target instanceof HTMLElement)) return
          const target = se.target as HTMLElement
          const isBg = target.classList.contains('bg-rect') || (target.tagName && target.tagName.toLowerCase() === 'svg')
      if (isBg) onBackgroundClick?.()
        })

      svg.on('dblclick.zoom', null)
      svg.call(zoom)
      zoomRef.current = zoom
      svg.call(zoom.transform, d3.zoomIdentity)
    } catch (e) {
      logger.debug('useGraphInteraction: zoom setup failed', e)
    }

    const pointerToGraphCoords = (ev: Event | d3.D3DragEvent<SVGCircleElement, NodeDatum, unknown>) => {
      const se = (ev as d3.D3DragEvent<SVGCircleElement, NodeDatum, unknown>).sourceEvent as Event | undefined
      const source = se ?? (ev as Event)
      const pt = d3.pointer(source, svg.node() as SVGSVGElement)
      const t = d3.zoomTransform(svg.node() as SVGSVGElement)
      return [(pt[0] - t.x) / t.k, (pt[1] - t.y) / t.k]
    }

    // pointer hover handlers depend on simulationStoppedRef
    try {
  // track pending pointerleave events while simulation is active
  const pendingLeaves = new Set<string>()

      const attachHandlers = () => {
        const panRefLocal = panInProgressRef
        const nodesAll = nodeSelRef.current
        const linksAll = linkSelRef.current
        const labelsAll = labelSelRef.current
        if (!nodesAll || !linksAll || !labelsAll) return false

        // build neighbor map for hover highlighting
        const neighborMap = new Map<string, Set<string>>()
        linksAll.each(function (d: LinkDatum) {
          const s = typeof d.source === 'string' ? d.source : (d.source as NodeDatum).id
          const t = typeof d.target === 'string' ? d.target : (d.target as NodeDatum).id
          if (!neighborMap.has(s)) neighborMap.set(s, new Set())
          if (!neighborMap.has(t)) neighborMap.set(t, new Set())
          neighborMap.get(s)!.add(t)
          neighborMap.get(t)!.add(s)
        })

  const isSimulationStopped = () => {
          try {
            if (simulationStoppedRef && simulationStoppedRef.current) return true
          } catch {
            // continue to velocity check if ref read fails
          }
          try {
            const sim = simulationRef?.current
            if (!sim) return false
            const nodes = sim.nodes() as NodeDatum[]
            if (!nodes || nodes.length === 0) return false
            let stoppedCount = 0
            for (let i = 0; i < nodes.length; i++) {
              const n = nodes[i]
              const vx = n.vx ?? 0
              const vy = n.vy ?? 0
              const s = Math.sqrt(vx * vx + vy * vy)
              if (n._autoPinned || s < 0.5) stoppedCount++
            }
            return stoppedCount / nodes.length >= 0.9
          } catch (e) {
            logger.debug('useGraphInteraction: isSimulationStopped failed', e)
            return false
          }
        }

                nodesAll.on('pointerenter', function (this: SVGCircleElement, _event: Event, d: NodeDatum) {
          try {
                    // ignore pointer noise while programmatic pan is active
                    try {
                      if (panRefLocal?.current) return
                    } catch (err) {
                      logger.debug('useGraphInteraction: panRef read failed', err)
                    }
            if (!isSimulationStopped()) return
          } catch {
            // hover early exit; ignore and bail
            logger.debug('useGraphInteraction: hover early exit')
            return
          }

          const hoveredId = d.id
          // cancel any pending leave for this node
          try { pendingLeaves.delete(hoveredId) } catch (e) { logger.debug('useGraphInteraction: pendingLeaves.delete failed', e) }
          nodesAll.classed('faded', true).classed('active', false)
          labelsAll.classed('faded', true)
          linksAll.classed('faded-link', true)

          d3.select(this).classed('faded', false).classed('active', true)
          labelsAll.filter((ld: NodeDatum) => ld.id === hoveredId).classed('faded', false)

          const neigh = neighborMap.get(hoveredId)
          if (neigh) {
            neigh.forEach(nid => {
              nodesAll.filter((nd: NodeDatum) => nd.id === nid).classed('faded', false).classed('active', true)
              labelsAll.filter((nd: NodeDatum) => nd.id === nid).classed('faded', false)
              linksAll
                .filter((ld: LinkDatum) => {
                  const sSource = ld.source
                  const s = typeof sSource === 'string' ? sSource : (sSource as NodeDatum).id
                  const tSource = ld.target
                  const t = typeof tSource === 'string' ? tSource : (tSource as NodeDatum).id
                  return (s === hoveredId && t === nid) || (t === hoveredId && s === nid)
                })
                .classed('faded-link', false)
            })
          }
        })

        // pointerleave: if simulation is stopped, clear immediately; otherwise record pending leave
                nodesAll.on('pointerleave', function (this: SVGCircleElement, _event: Event, d: NodeDatum) {
          try {
                    try {
                      if (panRefLocal?.current) return
                    } catch (err) {
                      logger.debug('useGraphInteraction: panRef read failed', err)
                    }
            const nodeId = d?.id
            if (isSimulationStopped()) {
              nodesAll.classed('faded', false).classed('active', false)
              labelsAll.classed('faded', false)
              linksAll.classed('faded-link', false)
            } else {
              // mark pending leave to be acted on when simulation stops
              if (nodeId) pendingLeaves.add(nodeId)
            }
          } catch (e) {
            logger.debug('useGraphInteraction: pointerleave handling failed', e)
          }
        })

        return true
      }

      // try immediate attach, else observe mutations to attach when DOM selections become available
      if (!attachHandlers()) {
        const svg = d3.select(svgRef.current!)
        const gRoot = svg.select<SVGGElement>('g.zoom-layer')
        const container = gRoot.empty() ? svg.node() : (gRoot.node() as Node)
        let mo: MutationObserver | null = null
        try {
          mo = new MutationObserver(() => {
              try {
                if (attachHandlers() && mo) {
                  mo.disconnect()
                  mo = null
                }
              } catch {
                logger.debug('useGraphInteraction: MutationObserver attach failed')
              }
            })
          if (container) mo.observe(container, { childList: true, subtree: true })
        } catch {
          logger.debug('useGraphInteraction: MutationObserver setup failed')
        }
      }
  // Listen for simulationStopped so we can apply any pending leaves detected during active sim
  handleSimStopped = () => {
        try {
          const nodesAll = nodeSelRef.current
          const linksAll = linkSelRef.current
          const labelsAll = labelSelRef.current
          if (!nodesAll || !linksAll || !labelsAll) return
          if (pendingLeaves.size === 0) return
          // if there were pending leaves, clear hover state globally
          nodesAll.classed('faded', false).classed('active', false)
          labelsAll.classed('faded', false)
          linksAll.classed('faded-link', false)
          pendingLeaves.clear()
        } catch (e) {
          logger.debug('useGraphInteraction: handleSimStopped failed', e)
        }
      }
      try {
        if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('pargame:simulationStopped', handleSimStopped)
      } catch (e) {
        logger.debug('useGraphInteraction: failed to add simulationStopped listener', e)
      }
  handleSimStarted = () => {
        try {
          // cancel any pending leaves when simulation starts so current hover stays active
          pendingLeaves.clear()
        } catch (e) {
          logger.debug('useGraphInteraction: handleSimStarted failed', e)
        }
      }
      try {
        if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('pargame:simulationStarted', handleSimStarted)
      } catch (e) {
        logger.debug('useGraphInteraction: failed to add simulationStarted listener', e)
      }
    } catch (e) {
      logger.debug('useGraphInteraction: DOM-dependent setup failed', e)
    }

    // attach drag behavior to nodes (uses pointerToGraphCoords and kickSimulation)
    try {
      const nodes = nodeSelRef.current
      if (nodes && simulationRef) {
        nodes.call((sel: d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown>) =>
          sel.call(
            d3
              .drag<SVGCircleElement, NodeDatum>()
              .on('start', (event, d) => {
                const se = (event as { sourceEvent?: Event } | undefined)?.sourceEvent
                if (se && typeof (se as Event).stopPropagation === 'function') {
                  ;(se as Event).stopPropagation()
                }
                // don't kick simulation on simple click; only mark dragging
                d._dragging = true
                // track whether we've kicked for this drag gesture
                ;(d as unknown as { _kicked?: boolean })._kicked = false
                try {
                  const [gx, gy] = pointerToGraphCoords(event as d3.D3DragEvent<SVGCircleElement, NodeDatum, unknown>)
                  d.fx = gx
                  d.fy = gy
                } catch {
                  d.fx = d.x ?? null
                  d.fy = d.y ?? null
                }
                })
              .on('drag', (event, d) => {
                try {
                  // If user actually moved the pointer, treat as a drag and kick simulation once
                  const movedDistance = Math.sqrt((event.dx ?? 0) * (event.dx ?? 0) + (event.dy ?? 0) * (event.dy ?? 0))
                  const movedEnough = movedDistance > (DRAG_PIXEL_THRESHOLD ?? 0)
                  if (movedEnough && !(d as unknown as { _kicked?: boolean })._kicked) {
                    kickSimulation?.(simulationRef.current ?? null, undefined)
                    ;(d as unknown as { _kicked?: boolean })._kicked = true
                  }
                  const [gx, gy] = pointerToGraphCoords(event as d3.D3DragEvent<SVGCircleElement, NodeDatum, unknown>)
                  d.fx = gx
                  d.fy = gy
                } catch {
                  d.fx = event.x
                  d.fy = event.y
                }
              })
                .on('end', (event, d) => {
                d._dragging = false
                try {
                  if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0)
                } catch (e) {
                  logger.debug('useGraphInteraction: drag end alphaTarget failed', e)
                }
                try {
                  // safe internal cast for ephemeral _kicked flag
                  const dk = d as NodeDatum & { _kicked?: boolean }
                  dk._kicked = false
                } catch (e) {
                  logger.debug('useGraphInteraction: failed to clear _kicked flag', e)
                }
                d.fx = null
                d.fy = null
              })
          )
        )
      }
    } catch (e) {
      logger.debug('useGraphInteraction: drag setup failed', e)
    }

    return () => {
      try { svg.on('.zoom', null) } catch (e) { logger.debug('useGraphInteraction cleanup zoom', e) }
      try { _nodesForCleanup?.on('pointerenter', null).on('pointerleave', null) } catch (e) { logger.debug('useGraphInteraction cleanup listeners', e) }
      try {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          if (handleSimStopped) window.removeEventListener('pargame:simulationStopped', handleSimStopped)
          if (handleSimStarted) window.removeEventListener('pargame:simulationStarted', handleSimStarted)
        }
      } catch (e) {
        logger.debug('useGraphInteraction: failed to remove simulation listeners', e)
      }
    }
  }, [svgRef, zoomRef, simulationRef, nodeSelRef, linkSelRef, labelSelRef, onBackgroundClick, kickSimulation, simulationStoppedRef, panInProgressRef])
}
