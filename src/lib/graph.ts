/**
 * src/lib/graph.ts
 * 책임: 컨텐츠(마크다운)에서 wiki-style 링크([[Target|Label]], [[Target#Anchor]])를 추출하고
 * 그래프 구조(GraphData)를 생성한다.
 * - 동기형: buildGraphForCollection
 * - 비동기형: buildGraphForCollectionAsync (코드 스플리팅 + 런타임 import 지원)
 * 이 모듈은 파일 시스템/번들러의 import.meta.glob 결과물을 파싱하여
 * 노드 목록(nodes)과 링크 목록(links)을 생성하는 역할만 담당한다.
 */
import type { GraphData, GraphNode } from '../types'
import { stripFrontmatter } from './frontmatter'

// Extract wiki-style links [[Target|Label]] or [[Target#Anchor]]
// extractWikiLinks: 문서 본문에서 [[...]] 형태의 위키 링크를 파싱해 목적지 id 목록을 반환
// 예: "[[Target|Label]]" -> "Target", "[[Target#Anchor]]" -> "Target"
function extractWikiLinks(src: string): string[] {
  const out: string[] = []
  const re = /\[\[([^\]]+)\]\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const raw = m[1].trim()
    if (!raw) continue
    const pipeIndex = raw.indexOf('|')
    const targetPart = pipeIndex >= 0 ? raw.slice(0, pipeIndex) : raw
    const hashIndex = targetPart.indexOf('#')
    const target = (hashIndex >= 0 ? targetPart.slice(0, hashIndex) : targetPart).trim()
    if (target) out.push(target)
  }
  return out
}

// The synchronous build function was removed in favor of the async API
// buildGraphForCollectionAsync which performs the same work but allows
// runtime dynamic imports and code-splitting.

// Async variant which dynamically imports content files so they can be code-split.
// buildGraphForCollectionAsync: 비동기 버전 — 런타임에 마크다운 모듈을 import 하여
// 코드스플리팅 효율을 높인다. 동작은 동기 버전과 동일하게 노드/링크를 생성한다.
export async function buildGraphForCollectionAsync(collection: string): Promise<GraphData> {
  // In Vite, with { import: 'default', query: '?raw' }, the loader resolves to a string in the browser.
  const relLoaders = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string | { default: string }>>
  const absLoaders = import.meta.glob('/src/content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string | { default: string }>>
  const allLoaders: Record<string, () => Promise<string | { default: string }>> = { ...relLoaders, ...absLoaders }

  const relPrefix = `../content/${collection}/`
  const absPrefix = `/src/content/${collection}/`
  const entries = Object.entries(allLoaders).filter(([path]) => path.includes(relPrefix) || path.includes(absPrefix))

  const modules: Record<string, string> = {}
  await Promise.all(entries.map(async ([path, loader]) => {
    try {
      const m = await loader()
      const raw = typeof m === 'string' ? m : (m as { default?: string })?.default ?? ''
      modules[path] = raw
    } catch {
      /* ignore individual import failures */
    }
  }))

  // Now reuse same parsing logic against the loaded modules
  const idToTitle = new Map<string, string>()
  const fileById = new Map<string, string>()
  for (const [path, content] of Object.entries(modules)) {
    const raw = typeof content === 'string' ? content : ''
    const file = path.split('/').pop() || ''
    const id = file.replace(/\.md$/, '')
    fileById.set(id, path)

    const m = raw.match(/^---[\s\S]*?\n\s*title:\s*(.+?)\n[\s\S]*?---/)
    let title = id
    if (m) {
      let v = m[1].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      title = v || id
    }
    idToTitle.set(id, title)
  }

  const nodesMap = new Map<string, GraphNode>()
  const linksSet = new Set<string>()

  for (const id of idToTitle.keys()) {
    nodesMap.set(id, { id, title: idToTitle.get(id) || id })
  }

  for (const [path, content] of Object.entries(modules)) {
    const raw = typeof content === 'string' ? content : ''
    const file = path.split('/').pop() || ''
    const srcId = file.replace(/\.md$/, '')
    const body = stripFrontmatter(raw)
  const targets = extractWikiLinks(body)

    for (const t of targets) {
      const targetId = t
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, { id: targetId, title: targetId, missing: true })
      }
      const key = `${srcId}-->${targetId}`
      if (!linksSet.has(key)) linksSet.add(key)
    }
  }

  const nodes = Array.from(nodesMap.values())
  const links = Array.from(linksSet).map(k => {
    const [s, t] = k.split('-->')
    return { source: s, target: t }
  })

  return { nodes, links }
}
