/**
 * src/lib/graphUtils.ts
 * 책임: 그래프 데이터(노드/원시 링크)를 다루는 유틸리티 집합.
 * - mapLinksToNodes: 문자열 id로 표현된 링크를 노드 참조(또는 id 그대로)로 매핑
 * - buildAdjacencyMap: 그래프 인접성(연결성)을 Set 형태로 구성
 * - getMissingSet: 누락된(missing) 노드들의 id 집합 반환
 * - colorNode: 노드 표시 색상 결정(간단한 스타일 헬퍼)
 */
import type { GraphNode } from '../types'

export type RawLink = { source: string; target: string }

// mapLinksToNodes: rawLinks는 source/target이 문자열 id인 배열이다.
// 이 함수를 통해 노드 객체 배열을 이용하여 실제 node 참조로 변환하거나,
// 매칭되는 노드가 없으면 문자열 id를 그대로 유지한다.
export function mapLinksToNodes(nodes: GraphNode[], rawLinks: RawLink[]) {
  const idToNode = new Map<string, GraphNode>(nodes.map(n => [n.id, n]))
  return rawLinks.map(l => ({
    source: idToNode.get(l.source) ?? l.source,
    target: idToNode.get(l.target) ?? l.target,
  }))
}

// buildAdjacencyMap: 양방향 인접성 맵을 생성한다. 노드가 없더라도 링크에서 등장하면 맵에 추가된다.
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

// getMissingSet: 그래프에서 missing 플래그가 설정된 노드 id 집합을 반환한다.
export function getMissingSet(nodes: GraphNode[]) {
  return new Set<string>(nodes.filter(n => n.missing).map(n => n.id))
}

// colorNode: 단순 색상 헬퍼 — missing 여부에 따라 색상을 반환.
export function colorNode(missing?: boolean) {
  return missing ? '#6b7280' : '#2563eb'
}
