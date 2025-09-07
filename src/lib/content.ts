/**
 * src/lib/content.ts
 * 책임: 콘텐츠 컬렉션의 경로/인덱스 관련 유틸리티
 * 주요 exports: listContentCollections, listSubCollections
 * 한글 설명: 파일 내용을 eager-import 하지 않고 경로 기반으로 컬렉션 정보를 수집합니다.
 */

/**
 * listContentCollections
 * - 반환: content 폴더 하위의 최상위 컬렉션명 배열
 */
/**
 * listContentCollections
 * @returns string[] - content 폴더 하위의 최상위 컬렉션명 배열
 */
export function listContentCollections(): string[] {
  // 모든 마크다운을 번들링하지 않도록 파일 경로만 읽습니다 (파일 내용을 eager-load 하지 않음)
  const relModules = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, unknown>
  const absModules = import.meta.glob('/content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, unknown>
  const entries = [...Object.keys(relModules), ...Object.keys(absModules)]
  const set = new Set<string>()
  for (const p of entries) {
    // '/src/content/<collection>/.../file.md' 또는 '../content/<collection>/...' 같은 경로를 정규화합니다.
    const idx = p.indexOf('/content/')
    if (idx === -1) continue
    const after = p.slice(idx + '/content/'.length)
    const top = after.split('/')[0]
    if (top) set.add(top)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

/**
 * listSubCollections
 * - parent: sub-root under /content (e.g., 'GraphArchives')
 * - returns immediate child folder names under /content/{parent}
 *
 * Note: Works with nested paths and doesn't import file contents.
 */
/**
 * listSubCollections
 * - parent: content 하위의 상위 폴더명(예: 'GraphArchives')
 * - returns: immediate child folder names under /content/{parent}
 */
/**
 * listSubCollections
 * @param parent content 하위의 상위 폴더명 (예: 'GraphArchives')
 * @returns string[] - immediate child folder names under /content/{parent}
 */
export function listSubCollections(parent: string): string[] {
  const relModules = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, unknown>
  const absModules = import.meta.glob('/content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, unknown>
  const entries = [...Object.keys(relModules), ...Object.keys(absModules)]
  const marker = `/content/${parent}/`
  const set = new Set<string>()
  for (const p of entries) {
    const idx = p.indexOf(marker)
    if (idx === -1) continue
    const after = p.slice(idx + marker.length)
    const first = after.split('/')[0]
    if (first) set.add(first)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}
