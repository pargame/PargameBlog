import type { Item } from './search'
import { parseFrontmatter } from './frontmatter'
import logger from './logger'

function extractNameFromPath(path: string) {
  const parts = path.split('/')
  const file = parts[parts.length - 1] || ''
  return file.replace(/\.md$/, '')
}

// Async loader: dynamically import only the requested collection's markdown files.
export async function getContentItemsForCollectionAsync(collection: string): Promise<Item[]> {
  const loaders = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string | { default: string }>>
  const prefix = `../content/${collection}/`
  const entries = Object.entries(loaders).filter(([p]) => p.startsWith(prefix))
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

// Deprecated sync API kept for compatibility; returns empty to avoid eager bundling.
export function getContentItemsForCollection(_collection: string): Item[] {
  if (import.meta.env.DEV) {
    logger.warn('[contentIndex] getContentItemsForCollection is deprecated; use getContentItemsForCollectionAsync')
  }
  return []
}
