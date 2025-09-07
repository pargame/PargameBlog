/**
 * src/hooks/useGraphSimulation.ts
 * 책임: D3 기반 force-simulation과 관련된 모든 DOM/시뮬레이션 로직을 캡슐화한다.
 */
import { useEffect } from 'react'
import * as d3 from 'd3'
import type { GraphNode } from '../types'
import type { RawLink } from '../types'
import { colorNode, getMissingSet, mapLinksToNodes } from '../lib/graphUtils'

type NodeDatum =
  GraphNode & {
    x?: number
    y?: number
    vx?: number
    vy?: number
    fx?: number | null
    fy?: number | null
    _idleTicks?: number
    _autoPinned?: boolean
    _dragging?: boolean
  }

type LinkDatum = { source: string | NodeDatum; target: string | NodeDatum }

type Params = {
  svgRef: React.MutableRefObject<SVGSVGElement | null>
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
  simulationStoppedRef?: React.MutableRefObject<boolean | null>
}

/**
 * 훅: useGraphSimulation
 * - 그래프에 대한 D3 force-simulation 생명주기와 DOM 바인딩을 캡슐화합니다.
 * - 주요 책임:
 *   1) SVG 레이어 초기화(배경 rect, 줌 레이어)
 *   2) 링크/노드/레이블 선택자 바인딩 및 ref 유지
 *   3) d3.forceSimulation 생성 혹은 재사용 및 tick/render 루프 관리
 *   4) 노드가 안정화되면 자동으로 고정(auto-pinning)하여 시뮬레이션 정지
 *   5) 드래그/줌/호버 핸들러 연결 (호버-언더라이팅은 시뮬레이션 정지 시만 동작)
 *
 * 파라미터는 `Params` 타입 참조. 일부 refs는 React 쪽에서 DOM 선택자를 참조할
 * 수 있도록 전달됩니다.
 */
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
    simulationStoppedRef,
  } = params

  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    const W = dims.w || width
    const H = dims.h || height

    const pointerToGraphCoords = (ev: Event | d3.D3DragEvent<SVGCircleElement, NodeDatum, unknown>) => {
      const se = (ev as d3.D3DragEvent<SVGCircleElement, NodeDatum, unknown>).sourceEvent as Event | undefined
      const source = se ?? (ev as Event)
      const pt = d3.pointer(source, svg.node() as SVGSVGElement)
      const t = d3.zoomTransform(svg.node() as SVGSVGElement)
      return [(pt[0] - t.x) / t.k, (pt[1] - t.y) / t.k]
    }

  // 시뮬레이션을 재가동하거나 가열(유도)합니다. 기존 타이머를 지우고
  // 일정 시간이 지나면 alphaTarget을 완화합니다.
  const kickSimulation = (sim: d3.Simulation<NodeDatum, LinkDatum> | null, target = 0.3, relaxTo = 0.05, relaxAfter = 1200) => {
      if (!sim) return
      try {
        if (simulationStoppedRef) simulationStoppedRef.current = false
      } catch (err) {
        // best-effort: if writing to the external ref fails, log for debug
        // (not an operational error)
        // eslint-disable-next-line no-console
        console.debug('useGraphSimulation: failed to write simulationStoppedRef', err)
      }
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

    const nodes: NodeDatum[] = data.nodes as NodeDatum[]
    const rawLinks: RawLink[] = data.links as RawLink[]
    const links: LinkDatum[] = mapLinksToNodes(nodes as GraphNode[], rawLinks) as LinkDatum[]

    let linkGroup = gRoot.select<SVGGElement>('g.links')
    if (linkGroup.empty()) linkGroup = gRoot.append('g').attr('class', 'links')
    let nodeGroup = gRoot.select<SVGGElement>('g.nodes')
    if (nodeGroup.empty()) nodeGroup = gRoot.append('g').attr('class', 'nodes')
    let labelGroup = gRoot.select<SVGGElement>('g.labels')
    if (labelGroup.empty()) labelGroup = gRoot.append('g').attr('class', 'labels')

  // 줌 동작을 초기화하고 svg에 연결합니다. 변환은 `g.zoom-layer`에 적용됩니다.
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
    } catch {
      // ignore
    }

    type D3Link = d3.SimulationLinkDatum<NodeDatum>
    let linkDataForBind: D3Link[] | LinkDatum[] = links
    const existingLinkForce = simulationRef.current ? (simulationRef.current.force('link') as d3.ForceLink<NodeDatum, LinkDatum> | null) : null
    if (existingLinkForce && typeof existingLinkForce.links === 'function') {
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
                  d._dragging = true
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

  // 호버 핸들러: 시뮬레이션이 정지된 경우에만 언더라이팅을 적용합니다.
  // (비 DOM 환경에서는 안전하게 무시됩니다.)
    try {
      const nodesAll = nodeGroup.selectAll<SVGCircleElement, NodeDatum>('circle')
      const linksAll = linkGroup.selectAll<SVGLineElement, LinkDatum>('line')
      const labelsAll = labelGroup.selectAll<SVGTextElement, NodeDatum>('text')

      const neighborMap = new Map<string, Set<string>>()
      for (let i = 0; i < links.length; i++) {
        const l = links[i]
        const s = typeof l.source === 'string' ? l.source : (l.source as NodeDatum).id
        const t = typeof l.target === 'string' ? l.target : (l.target as NodeDatum).id
        if (!neighborMap.has(s)) neighborMap.set(s, new Set())
        if (!neighborMap.has(t)) neighborMap.set(t, new Set())
        neighborMap.get(s)!.add(t)
        neighborMap.get(t)!.add(s)
      }

      nodesAll.on('pointerenter', function (_event: Event, d: NodeDatum) {
        try {
          if (!simulationStoppedRef || !simulationStoppedRef.current) return
        } catch (err) {
          // non-fatal: DOM may be unavailable in test environments
          // eslint-disable-next-line no-console
          console.debug('useGraphSimulation: hover handler early exit', err)
          return
        }

        nodesAll.classed('faded', true).classed('active', false)
        labelsAll.classed('faded', true)
        linksAll.classed('faded-link', true)

        const hoveredId = d.id
        d3.select(this).classed('faded', false).classed('active', true)
        labelsAll.filter((ld: NodeDatum) => ld.id === hoveredId).classed('faded', false)

        const neigh = neighborMap.get(hoveredId)
        if (neigh) {
            neigh.forEach(nid => {
            nodesAll.filter((nd: NodeDatum) => nd.id === nid).classed('faded', false).classed('active', true)
            labelsAll.filter((nd: NodeDatum) => nd.id === nid).classed('faded', false)
            linksAll
              .filter((ld: D3Link | LinkDatum) => {
                const sSource = (ld as D3Link).source
                const s = typeof sSource === 'string' ? sSource : (sSource as NodeDatum).id
                const tSource = (ld as D3Link).target
                const t = typeof tSource === 'string' ? tSource : (tSource as NodeDatum).id
                return (s === hoveredId && t === nid) || (t === hoveredId && s === nid)
              })
              .classed('faded-link', false)
          })
        }
      })

      nodesAll.on('pointerleave', function () {
        try {
          if (!simulationStoppedRef || !simulationStoppedRef.current) return
        } catch {
          return
        }
        nodesAll.classed('faded', false).classed('active', false)
        labelsAll.classed('faded', false)
        linksAll.classed('faded-link', false)
      })
    } catch {
      // ignore in non-DOM environments
    }

  // 레이블 바인딩: 노드 레이블을 별도 그룹에 추가하여 노드/링크보다 위에
  // 표시되도록 하고, 표시/비표시 제어를 쉽게 합니다.
  const labelSel = labelGroup.selectAll<SVGTextElement, NodeDatum>('text').data(nodes as NodeDatum[], (d: NodeDatum) => d.id)
    labelSel.join(
      enter =>
        enter
          .append('text')
          .attr('class', 'label')
          .attr('font-size', 11)
          .attr('fill', '#c9d4e3')
          .attr('stroke', 'none')
          .attr('pointer-events', 'none')
          .style('opacity', 1)
          .style('font-family', 'Arial, sans-serif')
          .text(d => d.title),
      update => update.text(d => d.title),
      exit => exit.remove()
    )
    labelSelRef.current = labelGroup.selectAll('text')

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

      let frameRequested = false
      const renderPositions = () => {
        frameRequested = false
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
      }

      const NODE_SPEED_THRESHOLD = 0.5
      const NODE_IDLE_RATIO = 0.9
      const IDLE_TICKS_TO_STOP = 5

      const missingSet = getMissingSet(nodes as GraphNode[])

      simulationRef.current.on('tick', () => {
        if (!frameRequested) {
          frameRequested = true
          window.requestAnimationFrame(renderPositions)
        }

        try {
          const sim = simulationRef.current
          if (!sim) return
          const currentNodes = sim.nodes() as NodeDatum[]

          let autoPinnedCount = 0
          let draggingCount = 0
          for (let i = 0; i < currentNodes.length; i++) {
            const n = currentNodes[i]
            if (!n._idleTicks) n._idleTicks = 0
            if (!n._autoPinned) n._autoPinned = false
            if (n._dragging) draggingCount++

            const vx = n.vx ?? 0
            const vy = n.vy ?? 0
            const s = Math.sqrt(vx * vx + vy * vy)
            if (s < NODE_SPEED_THRESHOLD) {
              n._idleTicks = (n._idleTicks ?? 0) + 1
            } else {
              n._idleTicks = 0
            }

            if (!n._autoPinned && !(n._dragging) && (n._idleTicks ?? 0) >= IDLE_TICKS_TO_STOP) {
              n.vx = 0
              n.vy = 0
              n.fx = n.x ?? null
              n.fy = n.y ?? null
              n._autoPinned = true
            }

            if (n._autoPinned) autoPinnedCount++
          }

          const ratio = currentNodes.length > 0 ? autoPinnedCount / currentNodes.length : 1
          if (ratio >= NODE_IDLE_RATIO && draggingCount === 0) {
            try {
              sim.stop()
              try {
                if (simulationStoppedRef) simulationStoppedRef.current = true
                } catch (innerErr) {
                  // best-effort write; log and continue
                  // eslint-disable-next-line no-console
                  console.debug('useGraphSimulation: failed to mark stopped', innerErr)
                }
            } catch (err) {
                // ignore rendering error, but log for debugging
                // eslint-disable-next-line no-console
                console.debug('useGraphSimulation: error stopping simulation', err)
              }
            for (let i = 0; i < currentNodes.length; i++) {
              currentNodes[i]._idleTicks = 0
            }
          }
        } catch (err) {
          // ignore tick loop error, but log to assist debugging
          // eslint-disable-next-line no-console
          console.debug('useGraphSimulation: tick handler error', err)
        }
      })

      kickSimulation(simulationRef.current)
      renderPositions()

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
  }, [svgRef, dims.w, dims.h, width, height, data, onNodeClick, onBackgroundClick, initializedRef, kickTimerRef, zoomRef, simulationRef, nodeSelRef, linkSelRef, labelSelRef, showMissingRef, simulationStoppedRef])
}
