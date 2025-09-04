export type GraphNode = {
  id: string
  title: string
  missing?: boolean
}

export type GraphLink = {
  source: string
  target: string
}

export type GraphData = {
  nodes: GraphNode[]
  links: GraphLink[]
}

// Strip top YAML frontmatter if present
function stripFrontmatter(src: string): string {
  // 허용: BOM/공백/빈 줄이 앞에 와도 프런트매터 감지
  const leading = src.match(/^[\ufeff\s]*/)
  const offset = leading ? leading[0].length : 0
  const rest = src.slice(offset)
  const m = rest.match(/^---\s*[\r\n]+[\s\S]*?^[ \t]*---\s*[\r\n]+/m)
  return m ? rest.slice(m[0].length) : src
}

// Extract wiki-style links [[Target|Label]] or [[Target#Anchor]]
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

// Build graph for collection under src/content/<collection>
export function buildGraphForCollection(collection: string): GraphData {
  // Gather raw markdown modules across content
  const all = {
    ...(import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>),
    ...(import.meta.glob('/src/content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>),
  }
  const prefix1 = `/src/content/${collection}/`
  const prefix2 = `../content/${collection}/`
  const entries = Object.entries(all).filter(([p]) => p.includes(prefix1) || p.includes(prefix2))

  const idToTitle = new Map<string, string>()
  const fileById = new Map<string, string>()
  for (const [path, mod] of entries) {
    const raw = typeof mod === 'string' ? mod : (mod && (mod as { default?: string }).default ? (mod as { default: string }).default : '')
    const file = path.split('/').pop() || ''
    const id = file.replace(/\.md$/, '')
    fileById.set(id, path)
    // Try to read title from frontmatter
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

  // Ensure all existing files become nodes
  for (const id of idToTitle.keys()) {
    nodesMap.set(id, { id, title: idToTitle.get(id) || id })
  }

  // Parse links to create edges and add missing nodes
  for (const [path, mod] of entries) {
    const raw = typeof mod === 'string' ? mod : (mod && (mod as { default?: string }).default ? (mod as { default: string }).default : '')
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
      if (!linksSet.has(key)) {
        linksSet.add(key)
      }
    }
  }

  const nodes = Array.from(nodesMap.values())
  const links = Array.from(linksSet).map(k => {
    const [s, t] = k.split('-->')
    return { source: s, target: t }
  })

  return { nodes, links }
}
