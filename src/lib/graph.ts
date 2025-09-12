/**
 * src/lib/graph.ts
 * 책임: 마크다운 콘텐츠로부터 GraphData(nodes, links)를 생성하는 비동기 빌더
 * exports: buildGraphForCollectionAsync(collection) => Promise<GraphData>
 */

import type { GraphData, GraphNode } from '../types'
import { buildIdTitleMap, extractWikiLinks } from './graphParser'

export async function buildGraphForCollectionAsync(collection: string): Promise<GraphData> {
  const relLoaders = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string | { default: string }>>
  const absLoaders = import.meta.glob('/content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string | { default: string }>>
  const allLoaders = { ...relLoaders, ...absLoaders }

  const relPrefix = `../content/${collection}/`
  const absPrefix = `/content/${collection}/`
  const entries = Object.entries(allLoaders).filter(([p]) => p.includes(relPrefix) || p.includes(absPrefix))

  const modules: Record<string, string> = {}
  await Promise.all(entries.map(async ([path, loader]) => {
    try {
      const m = await loader() as string | { default?: string }
      const raw = typeof m === 'string' ? m : m?.default ?? ''
      modules[path] = raw
    } catch {
      // ignore individual import failures
    }
  }))

  const { idToTitle } = buildIdTitleMap(modules)

  const nodesMap = new Map<string, GraphNode>()
  const linksSet = new Set<string>()

  for (const id of idToTitle.keys()) {
    nodesMap.set(id, { id, title: idToTitle.get(id) || id })
  }

  for (const [path, content] of Object.entries(modules)) {
    const raw = typeof content === 'string' ? content : ''
    const file = path.split('/').pop() || ''
    const srcId = file.replace(/\.md$/, '')
    const body = raw.replace(/^---[\s\S]*?---/, '')
    const targets = extractWikiLinks(body)

    for (const t of targets) {
      const targetId = t
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, { id: targetId, title: targetId, missing: true })
      }
      linksSet.add(`${srcId}-->${targetId}`)
    }
  }

  const nodes = Array.from(nodesMap.values())
  const links = Array.from(linksSet).map(k => {
    const [s, t] = k.split('-->')
    return { source: s, target: t }
  })

  return { nodes, links }
}

