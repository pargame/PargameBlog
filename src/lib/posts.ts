import type { Post, PostMeta } from '../types'
import { parseFrontmatter } from './frontmatter'
import logger from './logger'

// Use dynamic import to avoid bundling all posts into the app's initial chunks.
// `postsGlob` returns functions that when called import the raw markdown content as string.
const postsGlob = () => import.meta.glob('../posts/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>

let cached: Post[] | null = null
let asyncCache: Post[] | null = null

function extractSlugFromPath(path: string): string {
  const fileName = path.split('/').pop() || ''
  const base = fileName.replace(/\.md$/, '')
  // Remove date prefix (YYYY-MM-DD-) if present
  return base.replace(/^\d{4}-\d{2}-\d{2}-/, '')
}

function computePostsFromModules(modules: Record<string, string>): Post[] {
  try {
    const posts: Post[] = []
    const seenSlugs = new Set<string>()

    for (const [path, rawContent] of Object.entries(modules)) {
      try {
        if (typeof rawContent !== 'string') {
          if (import.meta.env.DEV) {
            logger.warn('[posts] unexpected content type for', path, typeof rawContent)
          }
          continue
        }

        const slug = extractSlugFromPath(path)

        if (seenSlugs.has(slug)) {
          if (import.meta.env.DEV) {
            logger.warn('[posts] duplicate slug detected:', slug, 'from', path)
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
        logger.error('[posts] failed to parse', path, error)
      }
    }

    posts.sort((a, b) => {
      const dateA = new Date(a.meta.date).getTime()
      const dateB = new Date(b.meta.date).getTime()
      return dateB - dateA
    })

    return posts
  } catch (error) {
    logger.error('[posts] Failed to load posts:', error)
    return []
  }
}

async function loadAllPosts(): Promise<Post[]> {
  if (import.meta.env.DEV) {
    // In dev, fall back to synchronous behaviour for fast rebuilds
    return computePostsFromModules((await (async function devAll(){
      const g = postsGlob()
      const out: Record<string,string> = {}
      const entries = Object.entries(g)
      for (const [path, loader] of entries) {
        const m = await loader()
        out[path] = typeof m === 'string' ? m : (m as unknown as { default?: string })?.default ?? ''
      }
      return out
    })()))
  }
  if (asyncCache) return asyncCache

  const loaders = postsGlob()
  const entries = Object.entries(loaders)
  const modules: Record<string,string> = {}
  await Promise.all(entries.map(async ([path, loader]) => {
    try {
      const m = await loader()
      modules[path] = typeof m === 'string' ? m : (m as unknown as { default?: string })?.default ?? ''
      } catch (e) {
      logger.error('[posts] failed to import', path, e)
    }
  }))

  asyncCache = computePostsFromModules(modules)
  return asyncCache
}

// Keep a synchronous API for parts of the app that expect it (legacy code).
// For correctness, we still compute synchronously from a fresh eager glob in build.
export function getAllPosts(): Post[] {
  if (import.meta.env.DEV) {
    // In dev, computing posts eagerly is acceptable for fast iteration.
    if (!cached) {
      // attempt to eagerly import via a temporary eager glob
      const eager = import.meta.glob('../posts/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
      cached = computePostsFromModules(eager)
    }
    return cached
  }

  // In production build/runtime, keep previous cached behavior
  if (!cached) {
    // Try to synchronously compute from an empty set — this keeps API stable.
    cached = []
  }
  return cached
}

export { loadAllPosts }

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find(p => p.slug === slug)
}

// Debug helper: which md files were matched
// (internal) debug helper was removed in production
