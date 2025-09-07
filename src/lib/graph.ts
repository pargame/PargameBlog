/**
 * src/lib/graph.ts
 * 책임: 컨텐츠(마크다운)에서 wiki-style 링크를 추출하고 GraphData를 생성하는 비동기 빌더
 *
 * 계약(Contract):
 * - 입력: collection (string) — `src/content/{collection}` 하위 폴더를 스캔합니다.
 * - 출력: Promise<GraphData> — { nodes: GraphNode[], links: RawLink[] }
 * - 실패모드: 개별 파일 로드 실패는 무시되고, 가능한 파일들만으로 그래프를 구성합니다.
 * - 에지케이스: frontmatter가 없거나 title이 없는 문서는 id를 title로 사용합니다. 링크 대상이 문서 집합에 없으면 missing 노드로 표시됩니다.
 *
 * 사용예:
 *   import { buildGraphForCollectionAsync } from '../lib/graph'
 *   const g = await buildGraphForCollectionAsync('UnrealEngine')
 *
 * 마이그레이션 메모: 동기 API는 제거되어 비동기 런타임 import 기반으로 동작합니다. 이 파일은 `graphParser`의 유틸을 사용합니다.
 */

import type { GraphData, GraphNode } from '../types'
import { buildIdTitleMap, extractWikiLinks } from './graphParser'

/**
 * buildGraphForCollectionAsync
 * - collection: subfolder under src/content to scan (e.g. 'UnrealEngine')
 * - returns GraphData with nodes and links discovered from wiki-style links
 */
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

