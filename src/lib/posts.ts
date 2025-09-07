/**
 * src/lib/posts.ts
 * 책임: 블로그 마크다운 포스트를 동적으로 로드하여 Post 객체 배열로 변환합니다.
 * 주요 exports: loadAllPosts, getPostBySlugAsync
 * 한글 설명: DEV/Prod에서 서로 다른 로드 전략을 사용합니다.
 */

import type { Post, PostMeta } from '../types'
import { parseFrontmatter } from './frontmatter'
import logger from './logger'
import unwrapModuleDefault from './moduleUtils'

// 앱의 초기 청크에 모든 포스트를 번들링하지 않도록 동적 임포트를 사용합니다.
// `postsGlob`은 호출 시 원시 마크다운 콘텐츠를 문자열로 임포트하는 함수를 반환합니다.
// 여러 콘텐츠 위치를 지원합니다:
// - /content/posts/** (소문자)
// - /content/Postings/** (사용자가 이름을 바꾼 폴더, 대소문자 변형)
const postsGlob = () => {
  const absLower = import.meta.glob('/content/posts/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>
  const absUpper = import.meta.glob('/content/Postings/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>
  return { ...absLower, ...absUpper }
}

let asyncCache: Post[] | null = null

function extractSlugFromPath(path: string): string {
  const fileName = path.split('/').pop() || ''
  const base = fileName.replace(/\.md$/, '')
  // 날짜 접두사(YYYY-MM-DD-)가 있으면 제거합니다.
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

  // 왜: frontmatter에서 title/date를 추출하여 PostMeta를 구성. 렌더링/정렬에 사용됨
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
  if (asyncCache) return asyncCache

  const loaders = postsGlob()
  const entries = Object.entries(loaders)
  const modules: Record<string,string> = {}
  await Promise.all(entries.map(async ([path, loader]) => {
    try {
  const m = await loader()
  const val = unwrapModuleDefault<string | { default?: string }>(m)
  modules[path] = typeof val === 'string' ? val : (val?.default ?? '')
      } catch (e) {
      logger.error('[posts] failed to import', path, e)
    }
  }))

  asyncCache = computePostsFromModules(modules)
  return asyncCache
}

export { loadAllPosts }

/**
 * getPostBySlugAsync
 * @param slug 포스트의 slug
 * @returns Promise<Post | undefined> - 비동기 방식으로 포스트를 로드합니다.
 */
export async function getPostBySlugAsync(slug: string): Promise<Post | undefined> {
  const posts = await loadAllPosts()
  return posts.find(p => p.slug === slug)
}

// 디버그 헬퍼: 어떤 md 파일이 매칭되었는지
// (내부) 디버그 헬퍼는 프로덕션에서 제거되었습니다.
