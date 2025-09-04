import type { Post, PostMeta } from '../types'

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

// Eagerly import all markdown files as raw strings
// Only from src/posts/ directory (moved back from content/posts)
const allMarkdownModules = import.meta.glob('../posts/**/*.md', { 
  query: '?raw', 
  import: 'default', 
  eager: true 
}) as Record<string, string>

let cached: Post[] | null = null

function extractSlugFromPath(path: string): string {
  const fileName = path.split('/').pop() || ''
  const base = fileName.replace(/\.md$/, '')
  // Remove date prefix (YYYY-MM-DD-) if present
  return base.replace(/^\d{4}-\d{2}-\d{2}-/, '')
}

function computePosts(): Post[] {
  try {
    const posts: Post[] = []
    const seenSlugs = new Set<string>()
    
    for (const [path, rawContent] of Object.entries(allMarkdownModules)) {
      try {
        if (typeof rawContent !== 'string') {
          if (import.meta.env.DEV) {
            console.warn('[posts] unexpected content type for', path, typeof rawContent)
          }
          continue
        }
        
        const slug = extractSlugFromPath(path)
        
        // Skip duplicates (in case same file exists in both locations)
        if (seenSlugs.has(slug)) {
          if (import.meta.env.DEV) {
            console.warn('[posts] duplicate slug detected:', slug, 'from', path)
          }
          continue
        }
        seenSlugs.add(slug)
        
        const { data, content } = parseFrontmatter(rawContent)
        const meta: PostMeta = {
          title: data.title || slug,
          date: data.date || '1970-01-01',
          excerpt: data.excerpt,
          author: data.author,
        }
        
        posts.push({ slug, meta, content })
      } catch (error) {
        console.error('[posts] failed to parse', path, error)
      }
    }
    
    // Sort by date descending (newest first)
    posts.sort((a, b) => {
      const dateA = new Date(a.meta.date).getTime()
      const dateB = new Date(b.meta.date).getTime()
      return dateB - dateA // newest first
    })
    
    return posts
  } catch (error) {
    console.error('[posts] Failed to load posts:', error)
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
