/**
 * src/lib/doc.ts
 * 책임: 단일 문서 로딩 유틸
 * exports: getDocFromCollection(collection, id) -> { id, title, content } | undefined
 */

// Lightweight helpers to load a single markdown document from a given collection
// under src/content/<collection>/... using Vite's import.meta.glob.
import { parseFrontmatter } from './frontmatter'

type Doc = {
  id: string
  title: string
  content: string
}

export function getDocFromCollection(collection: string, id: string): Doc | undefined {
  const rel = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
  const abs = import.meta.glob('/content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
  const all = { ...rel, ...abs }

  const prefix1 = `/content/${collection}/`
  const prefix2 = `../content/${collection}/`

  for (const [path, mod] of Object.entries(all)) {
    if (!(path.includes(prefix1) || path.includes(prefix2))) continue
    const file = path.split('/').pop() || ''
    const base = file.replace(/\.md$/, '')
    if (base !== id) continue
  const raw = typeof mod === 'string' ? mod : (mod && (mod as { default?: string }).default ? (mod as { default: string }).default : '')
    const parsed = parseFrontmatter(raw)
    const title = parsed.data.title || base
    return { id: base, title, content: parsed.content }
  }
  return undefined
}
