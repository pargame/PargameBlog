import type { GraphData, GraphNode } from '../types'
import { stripFrontmatter } from './frontmatter'

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
  // Gather raw markdown modules across content - using only relative paths for Vite compatibility
  const all = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
  
  const collectionPath = `../content/${collection}/`
  const entries = Object.entries(all).filter(([path]) => path.includes(collectionPath))

  const idToTitle = new Map<string, string>()
  const fileById = new Map<string, string>()
  for (const [path, content] of entries) {
    const raw = typeof content === 'string' ? content : ''
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
  for (const [path, content] of entries) {
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

// Async variant which dynamically imports content files so they can be code-split.
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
    const targets = (function extract(src: string) {
      const out: string[] = []
      const re = /\[\[([^\]]+)\]\]/g
      let m: RegExpExecArray | null
      while ((m = re.exec(src))) {
        const raw2 = m[1].trim()
        if (!raw2) continue
        const pipeIndex = raw2.indexOf('|')
        const targetPart = pipeIndex >= 0 ? raw2.slice(0, pipeIndex) : raw2
        const hashIndex = targetPart.indexOf('#')
        const target = (hashIndex >= 0 ? targetPart.slice(0, hashIndex) : targetPart).trim()
        if (target) out.push(target)
      }
      return out
    })(body)

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
