import { useCallback, useEffect } from 'react'
import * as d3 from 'd3'
import type { GraphNode, RawLink } from '../types'
import { colorNode, getMissingSet, mapLinksToNodes } from '../lib/graphUtils'
import logger from '../lib/logger'
import type { LinkDatum, NodeDatum, RenderingParams } from './types'

export default function useGraphRendering(params: RenderingParams) {
  const { svgRef, dims, width, height, data, onNodeClick, onBackgroundClick, nodeSelRef, linkSelRef, labelSelRef } = params

  const selectedId = params.selectedNodeId as string | null | undefined

  // renderPositions and updateVisibility are returned so other hooks (simulation) can call them
  const renderPositions = useCallback(() => {
    const W = dims.w || width
    const H = dims.h || height
    const linkSel = linkSelRef.current
    const nodeSel = nodeSelRef.current
    const labelSel = labelSelRef.current
    if (!linkSel || !nodeSel || !labelSel) return

    linkSel
      .attr('x1', (d: LinkDatum) => (typeof d.source === 'string' ? 0 : (d.source as NodeDatum).x ?? 0))
      .attr('y1', (d: LinkDatum) => (typeof d.source === 'string' ? 0 : (d.source as NodeDatum).y ?? 0))
      .attr('x2', (d: LinkDatum) => (typeof d.target === 'string' ? 0 : (d.target as NodeDatum).x ?? 0))
      .attr('y2', (d: LinkDatum) => (typeof d.target === 'string' ? 0 : (d.target as NodeDatum).y ?? 0))

    nodeSel
      .attr('cx', (d: NodeDatum) => {
        if (d.x === undefined) d.x = W / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.6
        return d.x ?? W / 2
      })
      .attr('cy', (d: NodeDatum) => {
        if (d.y === undefined) d.y = H / 2 + (Math.random() - 0.5) * Math.min(W, H) * 0.6
        return d.y ?? H / 2
      })

    labelSel.attr('x', (d: NodeDatum) => (d.x ?? W / 2) + 10).attr('y', (d: NodeDatum) => (d.y ?? H / 2) + 4)
  }, [dims.w, dims.h, width, height, linkSelRef, nodeSelRef, labelSelRef])

  const updateVisibility = useCallback(
    (show: boolean) => {
      const nodes = data.nodes as NodeDatum[]
      const missingSet = getMissingSet(nodes)
      nodeSelRef.current?.style('display', (d: NodeDatum) => (!show && d.missing ? 'none' : null))
      labelSelRef.current?.style('display', (d: NodeDatum) => (!show && d.missing ? 'none' : null))
      linkSelRef.current?.style('display', (d: LinkDatum) => {
        const s = typeof d.source === 'string' ? d.source : (d.source as NodeDatum).id
        const t = typeof d.target === 'string' ? d.target : (d.target as NodeDatum).id
        return !show && (missingSet.has(s) || missingSet.has(t)) ? 'none' : null
      })
    },
    [data.nodes, nodeSelRef, linkSelRef, labelSelRef]
  )

  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    const W = dims.w || width
    const H = dims.h || height

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

    // bind links/nodes/labels (no drag here)
    const linkSel = linkGroup.selectAll<SVGLineElement, LinkDatum>('line').data(links as LinkDatum[], (d: LinkDatum) => {
      const s = typeof d.source === 'string' ? d.source : (d.source as NodeDatum).id
      const t = typeof d.target === 'string' ? d.target : (d.target as NodeDatum).id
      return `${s}::${t}`
    })
    linkSel.join(enter => enter.append('line').attr('class', 'link').style('opacity', 1).style('cursor', 'default'), update => update, exit => exit.remove())
    linkSelRef.current = linkGroup.selectAll('line')

    const nodeSel = nodeGroup.selectAll<SVGCircleElement, NodeDatum>('circle').data(nodes as NodeDatum[], (d: NodeDatum) => d.id)
    nodeSel.join(
      enter =>
        enter
          .append('circle')
          .attr('class', (d: NodeDatum) => `node${d.missing ? ' missing' : ''}`)
          .attr('r', 8)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .attr('pointer-events', 'all')
          .style('opacity', 1)
          .attr('fill', (d: NodeDatum) => colorNode(d.missing))
          .on('click', (_evt, d) => {
            _evt.stopPropagation()
            if (!d.missing) onNodeClick?.({ id: d.id, title: d.title, missing: d.missing })
          }),
      update => update.attr('fill', d => colorNode(d.missing)).attr('class', (d: NodeDatum) => `node${d.missing ? ' missing' : ''}`),
      exit => exit.remove()
    )
    nodeSelRef.current = nodeGroup.selectAll('circle')

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

    // initial visibility
    updateVisibility(true)

    return () => {
      // cleanup selections (leave SVG structure intact)
      try { nodeSelRef.current = null } catch (e) { logger.debug('useGraphRendering cleanup nodeSelRef', e) }
      try { linkSelRef.current = null } catch (e) { logger.debug('useGraphRendering cleanup linkSelRef', e) }
      try { labelSelRef.current = null } catch (e) { logger.debug('useGraphRendering cleanup labelSelRef', e) }
    }
  }, [svgRef, dims.w, dims.h, width, height, data, onNodeClick, onBackgroundClick, linkSelRef, nodeSelRef, labelSelRef, updateVisibility, renderPositions])

  // Separate effect to update selected node class when selectedId changes
  useEffect(() => {
    try {
      const nodeSelection = nodeSelRef.current
      if (!nodeSelection) return
      
      logger.debug('useGraphRendering: updating selected node:', selectedId)
      
      if (selectedId) {
        nodeSelection.classed('selected', (d: NodeDatum) => d.id === selectedId)
        logger.debug('useGraphRendering: applied selected class to node:', selectedId)
      } else {
        nodeSelection.classed('selected', false)
        logger.debug('useGraphRendering: cleared all selected classes')
      }
    } catch (e) {
      logger.debug('useGraphRendering: selected class update failed', e)
    }
  }, [selectedId, nodeSelRef])

  return { renderPositions, updateVisibility }
}
