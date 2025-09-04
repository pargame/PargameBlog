// Lightweight frontmatter parser (browser-safe, no Buffer)
function parseFrontmatter(src: string): { data: Record<string, string>; content: string } {
  const result = { data: {} as Record<string, string>, content: src }
  const fm = src.match(/^---\s*[\r\n]+([\s\S]*?)^[ \t]*---\s*[\r\n]+/m)
  if (!fm) return result
  const yaml = fm[1] || ''
  // naive YAML: key: value per line (single-line values only)
  const data: Record<string, string> = {}
  for (const line of yaml.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf(':')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    // strip wrapping quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }
  result.data = data
  result.content = src.slice(fm[0].length)
  return result
}

export type PostMeta = {
  title: string
  date: string
  excerpt?: string
  author?: string
}

export type Post = {
  slug: string
  meta: PostMeta
  content: string
}

// Eagerly import all markdown files as raw strings (relative to this file)
// Use Vite's query/import to read files as raw strings (compatible with Vite 7)
// Prefer new location: src/content/posts; keep legacy support for src/posts during transition.
const modulesContentRel = import.meta.glob('../content/posts/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
const modulesContentAbs = import.meta.glob('/src/content/posts/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
const modulesLegacyRel = import.meta.glob('../posts/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
const modulesLegacyAbs = import.meta.glob('/src/posts/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
const rawModules = { ...modulesLegacyRel, ...modulesLegacyAbs, ...modulesContentRel, ...modulesContentAbs }

let cached: Post[] | null = null

function computePosts(): Post[] {
  try {
    if (import.meta.env.DEV) {
      // Debug: show matched markdown files in dev
      console.log('[posts] matched md files:', Object.keys(rawModules))
    }
    const postsBySlug = new Map<string, Post>()
    const posts: Post[] = []
  for (const [path, raw] of Object.entries(rawModules)) {
      try {
    const rawStr = typeof raw === 'string' ? raw : (typeof raw === 'object' && raw && 'default' in raw ? raw.default : undefined)
        if (typeof rawStr !== 'string') {
          if (import.meta.env.DEV) console.warn('[posts] unreadable raw module for', path, '=>', typeof raw, raw)
          continue
        }
        const fileName = path.split('/').pop() || ''
        const base = fileName.replace(/\.md$/, '')
        const slug = base.replace(/^\d{4}-\d{2}-\d{2}-/, '')
        const parsed = parseFrontmatter(rawStr)
  const data: Record<string, string> = parsed.data || {}
        const content = parsed.content || ''
  const dateValue = typeof data.date === 'string' && data.date.trim() ? data.date : '1970-01-01'
        const meta: PostMeta = {
          title: (data.title as string) || slug,
          date: dateValue,
          excerpt: data.excerpt as string | undefined,
          author: data.author as string | undefined,
        }
        if (!postsBySlug.has(slug)) {
          const post = { slug, meta, content }
          postsBySlug.set(slug, post)
          posts.push(post)
        }
      } catch (e) {
        console.error('[posts] failed to parse', path, e)
      }
    }
    // sort by date desc
    posts.sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1))
    if (import.meta.env.DEV) {
      console.info('[posts] total parsed:', posts.length)
    }
    return posts
  } catch (err) {
    console.error('[posts] Failed to load posts:', err)
    return []
  }
}

export function getAllPosts(): Post[] {
  if (import.meta.env.DEV) {
    return computePosts()
  }
  if (!cached) cached = computePosts()
  return cached
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find(p => p.slug === slug)
}

// Debug helper: which md files were matched
// (internal) debug helper was removed in production
