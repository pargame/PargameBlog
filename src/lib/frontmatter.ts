/**
 * src/lib/frontmatter.ts
 * Responsibility: Exports parseFrontmatter
 * Auto-generated header: add more descriptive responsibility by hand.
 */

// Shared frontmatter utilities for Markdown files

export type Frontmatter = Record<string, string>

// Remove YAML frontmatter and also return it to read fields (single-line values only)
export function parseFrontmatter(src: string): { data: Frontmatter; content: string } {
  const result = { data: {} as Frontmatter, content: src }
  const fm = src.match(/^---\s*[\r\n]+([\s\S]*?)^[ \t]*---\s*[\r\n]+/m)
  if (!fm) return result
  const yaml = fm[1] || ''
  const data: Frontmatter = {}
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

// Strip top YAML frontmatter if present (keeping body only)
export function stripFrontmatter(src: string): string {
  const leading = src.match(/^[\ufeff\s]*/)
  const offset = leading ? leading[0].length : 0
  const rest = src.slice(offset)
  const m = rest.match(/^---\s*[\r\n]+[\s\S]*?^[ \t]*---\s*[\r\n]+/m)
  return m ? rest.slice(m[0].length) : src
}
