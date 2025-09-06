import type { GraphNode } from '../types'

export type RawLink = { source: string; target: string }

// Convert RawLink[] (string ids) into link objects that contain node references
export function mapLinksToNodes(nodes: GraphNode[], rawLinks: RawLink[]) {
  const idToNode = new Map<string, GraphNode>(nodes.map(n => [n.id, n]))
  return rawLinks.map(l => ({
    source: idToNode.get(l.source) ?? l.source,
    target: idToNode.get(l.target) ?? l.target,
  }))
}

export function buildAdjacencyMap(nodes: GraphNode[], links: RawLink[]) {
  const adjacency = new Map<string, Set<string>>()
  nodes.forEach(n => adjacency.set(n.id, new Set([n.id])))
  links.forEach(l => {
    const s = l.source
    const t = l.target
    if (!adjacency.has(s)) adjacency.set(s, new Set())
    if (!adjacency.has(t)) adjacency.set(t, new Set())
    adjacency.get(s)!.add(t)
    adjacency.get(t)!.add(s)
  })
  return adjacency
}

export function getMissingSet(nodes: GraphNode[]) {
  return new Set<string>(nodes.filter(n => n.missing).map(n => n.id))
}

export function colorNode(missing?: boolean) {
  return missing ? '#6b7280' : '#2563eb'
}
