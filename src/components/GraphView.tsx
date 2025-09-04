import React, { memo, useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { GraphData, GraphNode } from '../types'
import './GraphView.css'

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
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const gRootRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const simulationRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null)
  const nodeSelRef = useRef<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const linkSelRef = useRef<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>(null)
  const labelSelRef = useRef<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const [showMissing, setShowMissing] = useState(true)
  const showMissingRef = useRef<boolean>(true)

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

    if (!initializedRef.current) {
      svg.selectAll('*').remove()
      svg
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('height', '100%')
        .classed('graph-svg', true)

      // Root group for zoom/pan
      // Remove clipPath to allow nodes to move freely beyond SVG boundaries
      
      // A background rect to capture panning drag events and provide a clean surface
      svg
        .append('rect')
        .attr('class', 'bg-rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', W)
        .attr('height', H)
        .attr('fill', 'transparent')
        .attr('pointer-events', 'all')
        .on('click', function(event) {
          event.stopPropagation()
          onBackgroundClick?.()
        })
      
      const gRoot = svg
        .append('g')
        .attr('class', 'zoom-layer')
        // Remove clip-path to allow free movement
        // 초기 렌더에서 tick이 발생하지 않아도 그래프가 보이도록 즉시 표시
        .style('opacity', 1)
      gRootRef.current = gRoot

      const colorNode = (missing?: boolean) => (missing ? '#ff8a8a' : '#9db9ff')
      const colorLink = '#63708a'

      const nodes: NodeDatum[] = data.nodes as NodeDatum[]
      const links: LinkDatum[] = data.links as unknown as LinkDatum[]

      const simulation = d3
        .forceSimulation<NodeDatum>(nodes)
        .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id((d) => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-180))
        .force('collision', d3.forceCollide<NodeDatum>().radius(18).strength(0.7))
        .force('x', d3.forceX(W / 2).strength(0.05))
        .force('y', d3.forceY(H / 2).strength(0.05))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .velocityDecay(0.4)
        .alpha(1)
        .alphaDecay(0.05)
      simulationRef.current = simulation

      const link = gRoot
        .append('g')
        .attr('stroke', colorLink)
        .attr('stroke-opacity', 0.6)
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke-width', 1.5)
        .style('opacity', 1)
      linkSelRef.current = link

      const node = gRoot
        .append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', 8)
        .attr('fill', (d) => colorNode(d.missing))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .style('opacity', 1)
        .on('click', (_evt, d) => {
          // 이벤트 전파 방지 (배경 클릭으로 처리되지 않도록)
          _evt.stopPropagation()
          // 미싱 노드가 아닌 경우에만 인사이트 패널 열기
          if (!d.missing) {
            onNodeClick?.({ id: d.id, title: d.title, missing: d.missing })
          }
        })
        .call(
          d3
            .drag<SVGCircleElement, NodeDatum>()
            .on('start', (event, d) => {
              // Prevent background panning while dragging a node
              const se: unknown = (event as unknown as { sourceEvent?: { stopPropagation?: () => void } }).sourceEvent
              if (typeof (se as { stopPropagation?: () => void } | undefined)?.stopPropagation === 'function')
                (se as { stopPropagation: () => void }).stopPropagation()
              if (!event.active) simulation.alphaTarget(0.3).restart()
              d.fx = d.x ?? null
              d.fy = d.y ?? null
            })
            .on('drag', (event, d) => {
              d.fx = event.x
              d.fy = event.y
            })
            .on('end', (event, d) => {
              if (!event.active) simulation.alphaTarget(0)
              d.fx = null
              d.fy = null
            })
        )
      nodeSelRef.current = node
      
      

      const label = gRoot
        .append('g')
        .selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .text((d) => d.title)
        .attr('font-size', 11)
        .attr('fill', '#c9d4e3')
        .attr('stroke', 'none')
        .attr('pointer-events', 'none')
        .style('opacity', 1)
        .style('font-family', 'Arial, sans-serif')
      labelSelRef.current = label
      
      
  // Zoom/Pan behavior including background drag to pan
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
          const t = (event as d3.D3ZoomEvent<SVGSVGElement, unknown>).transform
          gRoot.attr('transform', `translate(${t.x},${t.y}) scale(${t.k})`)
        })
        .on('start', () => {
          // 드래그 시작 시 배경 클릭과 동일한 처리
          onBackgroundClick?.()
        })

  // disable native dblclick zoom default by preventing default on dblclick
  svg.on('dblclick.zoom', null)
  svg.call(zoom)
  
  zoomRef.current = zoom
  // Optional: center initial view (will be adjusted after pre-tick)
  svg.call(zoom.transform, d3.zoomIdentity)

  let ticks = 0
  const didCenter = { current: false }

  // Precompute missing id set for visibility control
  const missingSet = new Set<string>(nodes.filter((n) => n.missing).map((n) => n.id))

  // Visibility updater reads current toggle from ref
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

  const renderPositions = () => {
      const linkSel = linkSelRef.current
      const nodeSel = nodeSelRef.current  
      const labelSel = labelSelRef.current
      
      if (!linkSel || !nodeSel || !labelSel) {
        
        return
      }
      
      linkSel
        .attr('x1', (d) => (typeof d.source === 'string' ? 0 : d.source.x ?? 0))
        .attr('y1', (d) => (typeof d.source === 'string' ? 0 : d.source.y ?? 0))
        .attr('x2', (d) => (typeof d.target === 'string' ? 0 : d.target.x ?? 0))
        .attr('y2', (d) => (typeof d.target === 'string' ? 0 : d.target.y ?? 0))

      // Viewport 내 소프트 클램핑으로 초기 이탈 방지
      // Remove padding constraints to allow nodes to move freely
      nodeSel
        .attr('cx', (d) => {
          // 초기값이 없으면 중앙 근처에 랜덤 배치
          if (d.x === undefined) {
            d.x = W / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.6
          }
          return d.x ?? W / 2
        })
        .attr('cy', (d) => {
          // 초기값이 없으면 중앙 근처에 랜덤 배치  
          if (d.y === undefined) {
            d.y = H / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.6
          }
          return d.y ?? H / 2
        })
      labelSel
        .attr('x', (d) => (d.x ?? W / 2) + 10)
        .attr('y', (d) => (d.y ?? H / 2) + 4)

  // 첫 진입 렌더 안정화: 원래는 1틱 이후 페이드인을 했으나
  // 일부 환경에서 tick이 발생하지 않아 영구 투명해지는 이슈가 있어 제거

      // 일정 틱 이후, 질량중심을 화면 중앙으로 1회 평행이동(스케일 변경 없음)
      ticks++
        if (!didCenter.current && ticks > 30) {
          const nx = nodes.map((n) => n.x ?? 0)
          const ny = nodes.map((n) => n.y ?? 0)
          const meanX = d3.mean(nx) ?? W / 2
          const meanY = d3.mean(ny) ?? H / 2
          const tx = W / 2 - meanX
          const ty = H / 2 - meanY
          const t = d3.zoomIdentity.translate(tx, ty)
          svg.transition().duration(300).call(zoom.transform, t)
          didCenter.current = true
        }
      }
      // Live ticking for dynamic layout
      simulation.on('tick', () => {
        ticks++
        renderPositions()
      })

      // 시뮬레이션 상태 확인
      
      
      
      // 시뮬레이션 강제 시작 - 더 강하게 활성화
      simulation.alpha(1).alphaTarget(0.1).restart()
      
      
      // 추가적인 활성화 - 드래그 시작과 같은 효과
      setTimeout(() => {
        simulation.alpha(1).alphaTarget(0.3).restart()
        
      }, 100)
      
      // 강제로 첫 번째 렌더링 실행 (tick이 없어도 노드가 보이도록)
      
      renderPositions()

      // 백업: 시뮬레이션이 작동하지 않는 경우 타이머로 수동 업데이트
      let tickCount = 0
      const manualTick = () => {
        tickCount++
        renderPositions()
        if (tickCount < 100) {
          setTimeout(manualTick, 16) // ~60fps
        }
      }
      
      // 1초 후에도 tick이 없으면 수동 애니메이션 시작
      setTimeout(() => {
        if (ticks === 0) {
          
          manualTick()
        }
      }, 1000)

      initializedRef.current = true

  // 초기 가시성 적용
  updateVisibility()

      return () => {
        simulation.stop()
      }
    }

    // Update-only path: when container resizes, adjust viewBox and background rect
    svg.attr('viewBox', `0 0 ${W} ${H}`)
    svg
      .select('rect.bg-rect')
      .attr('width', W)
      .attr('height', H)
  }, [dims.w, dims.h, width, height, data, onNodeClick, onBackgroundClick])

  // React to toggle changes without rebuilding D3 scene
  useEffect(() => {
    showMissingRef.current = showMissing
    const node = nodeSelRef.current
    const link = linkSelRef.current
    const label = labelSelRef.current
    if (node && link && label) {
      // Reuse the same logic as in init
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

  // 리사이즈 시 자동 맞춤 제거(인사이트 패널 열고 닫을 때 미세 줌 변화를 방지)

  return (
    <div ref={wrapRef} className="graph-wrap">
      <svg ref={svgRef} role="img" aria-label="graph view" />
      
      <div className="graph-controls">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showMissing}
            onChange={() => setShowMissing(v => !v)}
            style={{ cursor: 'pointer' }}
          />
          Include Missings
        </label>
      </div>
    </div>
  )
}

export default memo(GraphView)
