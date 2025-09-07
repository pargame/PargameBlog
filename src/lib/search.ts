/**
 * src/lib/search.ts
 * 책임: 클라이언트 사이드 검색 유틸리티
 * 주요 exports: searchItems, Item
 * 한글 설명: 단순한 부분 문자열 기반 스코어링으로 제목/슬러그를 검색합니다.
 */

// 클라이언트 사이드 제목/슬러그 검색을 위한 매우 작은 퍼지 검색 유틸리티
export type Item = { slug: string; title: string }

function score(text: string, query: string): number {
  // 대소문자를 구분하지 않는 간단한 부분 문자열 스코어링, 접두사 매치를 선호
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (!q) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 50
  return 0
}

export function searchItems(items: Item[], query: string, limit = 8) {
  if (!query.trim()) return []
  const scored = items
    .map(i => ({ i, s: Math.max(score(i.title, query), score(i.slug, query)) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.i)
  return scored
}
