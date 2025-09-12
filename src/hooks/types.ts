import type { GraphNode } from '../types'
import * as d3 from 'd3'

// Project-local ref handle type to avoid relying on React.MutableRefObject
// which the project treats as deprecated for cross-hook typing.
export type RefHandle<T> = { current: T | null }

export type NodeDatum =
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

export type LinkDatum = { source: string | NodeDatum; target: string | NodeDatum }

export type GraphRefs = {
  initializedRef: RefHandle<boolean>
  kickTimerRef: RefHandle<number | null>
  zoomRef: RefHandle<d3.ZoomBehavior<SVGSVGElement, unknown> | null>
  simulationRef: RefHandle<d3.Simulation<NodeDatum, LinkDatum> | null>
  nodeSelRef: RefHandle<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>
  linkSelRef: RefHandle<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>
  labelSelRef: RefHandle<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>
  simulationStoppedRef?: RefHandle<boolean | null>
  // true while a programmatic pan/transition is active so interaction handlers can ignore pointer noise
  panInProgressRef?: RefHandle<boolean | null>
}

export type Params = {
  svgRef: RefHandle<SVGSVGElement | null>
  dims: { w: number; h: number }
  width: number
  height: number
  data: { nodes: GraphNode[]; links: LinkDatum[] }
  onNodeClick?: (node: { id: string; title: string; missing?: boolean }) => void
  onBackgroundClick?: () => void
  initializedRef: RefHandle<boolean>
  kickTimerRef: RefHandle<number | null>
  zoomRef: RefHandle<d3.ZoomBehavior<SVGSVGElement, unknown> | null>
  simulationRef: RefHandle<d3.Simulation<NodeDatum, LinkDatum> | null>
  nodeSelRef: RefHandle<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>
  linkSelRef: RefHandle<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>
  labelSelRef: RefHandle<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>
  showMissing: boolean
  simulationStoppedRef?: RefHandle<boolean | null>
}

export type RenderingParams = {
  svgRef: RefHandle<SVGSVGElement | null>
  dims: { w: number; h: number }
  width: number
  height: number
  data: { nodes: GraphNode[]; links: LinkDatum[] }
  onNodeClick?: (node: { id: string; title: string; missing?: boolean }) => void
  onBackgroundClick?: () => void
  nodeSelRef: RefHandle<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>
  linkSelRef: RefHandle<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>
  labelSelRef: RefHandle<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>
  selectedNodeId?: string | null
}

export type InteractionParams = {
  svgRef: RefHandle<SVGSVGElement | null>
  zoomRef: RefHandle<d3.ZoomBehavior<SVGSVGElement, unknown> | null>
  simulationRef: RefHandle<d3.Simulation<NodeDatum, LinkDatum> | null>
  nodeSelRef: RefHandle<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>
  linkSelRef: RefHandle<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>
  labelSelRef: RefHandle<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>
  onBackgroundClick?: () => void
  kickSimulation?: (sim: d3.Simulation<NodeDatum, LinkDatum> | null, target?: number) => void
  simulationStoppedRef?: RefHandle<boolean | null>
  panInProgressRef?: RefHandle<boolean | null>
}

export type D3SimulationParams = {
  simulationRef: RefHandle<d3.Simulation<NodeDatum, LinkDatum> | null>
  nodeSelRef: RefHandle<d3.Selection<SVGCircleElement, NodeDatum, SVGGElement, unknown> | null>
  linkSelRef: RefHandle<d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> | null>
  labelSelRef: RefHandle<d3.Selection<SVGTextElement, NodeDatum, SVGGElement, unknown> | null>
  nodes: NodeDatum[]
  links: LinkDatum[]
  dims: { w: number; h: number }
  kickTimerRef: RefHandle<number | null>
  initializedRef: RefHandle<boolean>
  simulationStoppedRef?: RefHandle<boolean | null>
  renderPositions?: () => void
  updateVisibility?: (show: boolean) => void
  showMissing?: boolean
}
