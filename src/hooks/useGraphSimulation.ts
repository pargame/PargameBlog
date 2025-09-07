/**
 * src/hooks/useGraphSimulation.ts
 * 책임: D3 기반 force-simulation과 관련된 모든 DOM/시뮬레이션 로직을 캡슐화한다.
 * - SVG 및 그룹(gRoot) 초기화(배경 rect, 줌 레이어)
 * - 링크/노드/레이블 바인딩(enter/update/exit)
 * - d3.forceSimulation 생성/재사용, tick 처리 및 자동 정지 로직
 * - 드래그, 줌, 클릭 이벤트 처리
 *
 * 훅은 React 컴포넌트가 렌더링에만 집중할 수 있게 해주며,
 * 시뮬레이션 상태는 외부 ref(simulationRef 등)를 통해 전달/유지된다.
 */
/**
 * 계약 (간단한 계약):
 * - 입력(Params): 여러 React ref와 데이터 객체(nodes, links)를 받음. (자세한 타입은 파일 내 `Params` 참조)
 * - 출력: 부수효과로 SVG DOM을 수정하고 simulationRef/selRef들을 설정함.
 * - 라이프사이클: 훅은 내부적으로 cleanup을 제공하여 컴포넌트 언마운트 시 시뮬레이션을 중지하고 참조를 해제합니다.
 * - 에지케이스: 비어 있는 노드/링크, missing 노드 처리, 시뮬레이션 재사용(존재 시 업데이트) 지원.
 * - 사용예: useGraphSimulation({ svgRef, wrapRef, dims, width, height, data, ...refs })
 * - 테스트 팁: DOM을 실제로 생성하지 않는 환경에서는 ref들에 더미 엘리먼트를 할당하여 초기화/정리 흐름을 검증하세요.
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
    // 내부 시뮬레이션 상태: 렌더 루프에서 idle/pinned 판단에 사용
    _idleTicks?: number
    _autoPinned?: boolean
  }
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

  // Effect: DOM 바인딩, 시뮬레이션 생성/업데이트, 이벤트 바인딩 등은 아래 useEffect에서 처리한다.
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
          for (let i = 0; i < currentNodes.length; i++) {
            const n = currentNodes[i]
            if (!n._idleTicks) n._idleTicks = 0
            if (!n._autoPinned) n._autoPinned = false

            const vx = n.vx ?? 0
            const vy = n.vy ?? 0
            const s = Math.sqrt(vx * vx + vy * vy)
            if (s < NODE_SPEED_THRESHOLD) {
              n._idleTicks = (n._idleTicks ?? 0) + 1
            } else {
              n._idleTicks = 0
            }

            if (!n._autoPinned && (n._idleTicks ?? 0) >= IDLE_TICKS_TO_STOP) {
              n.vx = 0
              n.vy = 0
              n.fx = n.x ?? null
              n.fy = n.y ?? null
              n._autoPinned = true
            }

            if (n._autoPinned) autoPinnedCount++
          }

          const ratio = currentNodes.length > 0 ? autoPinnedCount / currentNodes.length : 1
          if (ratio >= NODE_IDLE_RATIO) {
            try {
              sim.stop()
            } catch {
              // ignore
            }
            for (let i = 0; i < currentNodes.length; i++) {
              currentNodes[i]._idleTicks = 0
            }
          }
        } catch {
          // ignore
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
