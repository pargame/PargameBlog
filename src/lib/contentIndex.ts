/**
 * src/lib/contentIndex.ts
 * 책임: 콘텐츠 컬렉션에서 문서 목록/메타를 추출하는 유틸
 * 주요 exports: getContentItemsForCollectionAsync
 * 한글 설명: 파일 경로 기반으로 제목/슬러그를 동적으로 수집합니다.
 */

import type { Item } from './search'
import { parseFrontmatter } from './frontmatter'

function extractNameFromPath(path: string) {
  const parts = path.split('/')
  const file = parts[parts.length - 1] || ''
  return file.replace(/\.md$/, '')
}

// Async loader: dynamically import only the requested collection's markdown files.
export async function getContentItemsForCollectionAsync(collection: string): Promise<Item[]> {
  const rel = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string | { default: string }>>
  const abs = import.meta.glob('/content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string | { default: string }>>
  const loaders = { ...rel, ...abs }
  const relPrefix = `../content/${collection}/`
  const absPrefix = `/content/${collection}/`
  const entries = Object.entries(loaders).filter(([p]) => p.startsWith(relPrefix) || p.startsWith(absPrefix))
  const modules: Record<string, string> = {}
  await Promise.all(entries.map(async ([p, loader]) => {
    try {
      const m = await loader()
      const raw = typeof m === 'string' ? m : (m as { default?: string })?.default ?? ''
      modules[p] = raw
    } catch {
      /* ignore file-level failures */
    }
  }))

  const items: Item[] = []
  for (const [p, raw] of Object.entries(modules)) {
    const name = extractNameFromPath(p)
    try {
      const rawText = typeof raw === 'string' ? raw : (raw as { default?: string }).default || ''
      const parsed = parseFrontmatter(rawText)
      const title = parsed.data.title || name
      items.push({ slug: name, title })
    } catch {
      items.push({ slug: name, title: name })
    }
  }
  return items
}

// Note: the old synchronous API was intentionally removed to avoid eager bundling.
// Use getContentItemsForCollectionAsync(collection) instead which dynamically imports content.
