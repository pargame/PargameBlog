import type { Item } from './search'
import { parseFrontmatter } from './frontmatter'

// Eagerly import content markdown files under src/content/** so we can search titles
const contentModules = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function extractNameFromPath(path: string) {
  const parts = path.split('/')
  const file = parts[parts.length - 1] || ''
  return file.replace(/\.md$/, '')
}

export function getContentItemsForCollection(collection: string): Item[] {
  const items: Item[] = []
  for (const [p, raw] of Object.entries(contentModules)) {
    const idx = p.indexOf('/content/')
    if (idx === -1) continue
    const after = p.slice(idx + '/content/'.length)
    if (!after.startsWith(collection + '/')) continue
    const name = extractNameFromPath(p)
    try {
      const rawText = typeof raw === 'string' ? raw : (raw as { default?: string }).default || ''
      const parsed = parseFrontmatter(rawText)
      const title = parsed.data.title || name
      items.push({ slug: name, title })
    } catch {
      // parsing failed; fallback to file name
      console.warn('[contentIndex] failed to parse frontmatter for', p)
      items.push({ slug: name, title: name })
    }
  }
  return items
}
