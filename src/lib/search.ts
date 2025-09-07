/**
 * src/lib/search.ts
 * Responsibility: Exports searchItems
 * Auto-generated header: add more descriptive responsibility by hand.
 */

// Very small fuzzy search utility for client-side title/slug search
export type Item = { slug: string; title: string }

function score(text: string, query: string): number {
  // simple case-insensitive substring score, prefer prefix matches
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
