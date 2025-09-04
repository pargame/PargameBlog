// Lightweight helpers to load a single markdown document from a given collection
// under src/content/<collection>/... using Vite's import.meta.glob.

export type Doc = {
  id: string
  title: string
  content: string
}

// Remove YAML frontmatter and also return it to read title if present
function parseFrontmatter(src: string): { data: Record<string, string>; content: string } {
  const result = { data: {} as Record<string, string>, content: src }
  const fm = src.match(/^---\s*[\r\n]+([\s\S]*?)^[ \t]*---\s*[\r\n]+/m)
  if (!fm) return result
  const yaml = fm[1] || ''
  const data: Record<string, string> = {}
  for (const line of yaml.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf(':')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    let value = t.slice(i + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }
  result.data = data
  result.content = src.slice(fm[0].length)
  return result
}

export function getDocFromCollection(collection: string, id: string): Doc | undefined {
  const rel = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
  const abs = import.meta.glob('/src/content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
  const all = { ...rel, ...abs }

  const prefix1 = `/src/content/${collection}/`
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
