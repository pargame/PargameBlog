/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'
import { buildAdjacencyMap, colorNode, getMissingSet, mapLinksToNodes } from '../graphUtils'

const nodes = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B', missing: true },
]
const rawLinks = [
  { source: 'a', target: 'b' },
  { source: 'a', target: 'c' },
]

describe('graphUtils', () => {
  it('maps links to node refs when available', () => {
    const mapped = mapLinksToNodes(nodes as any, rawLinks as any)
    expect(mapped[0].source).toEqual(nodes[0])
    expect(mapped[0].target).toEqual(nodes[1])
  })

  it('keeps string id when node is missing', () => {
    const mapped = mapLinksToNodes(nodes as any, rawLinks as any)
    expect(mapped[1].target).toBe('c')
  })

  it('getMissingSet returns set of missing ids', () => {
    const s = getMissingSet(nodes as any)
    expect(s.has('b')).toBe(true)
    expect(s.has('a')).toBe(false)
  })

  it('buildAdjacencyMap constructs bidirectional adjacency', () => {
    const adj = buildAdjacencyMap(nodes as any, rawLinks as any)
  expect(adj.get('a')!.has('b')).toBe(true)
  expect(adj.get('b')!.has('a')).toBe(true)
    // node c should also appear as key because link references it
    expect(adj.has('c')).toBe(true)
  })

  it('colorNode returns correct colors', () => {
    expect(colorNode(true)).toBe('#6b7280')
    expect(colorNode(false)).toBe('#2563eb')
    expect(colorNode()).toBe('#2563eb')
  })
})
