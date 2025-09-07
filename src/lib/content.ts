/**
 * src/lib/content.ts
 * Responsibility: Exports listContentCollections
 * Auto-generated header: add more descriptive responsibility by hand.
 */

// Utility to list top-level collections under src/content based on markdown files
export function listContentCollections(): string[] {
  // Only read file paths (do NOT eager-load file contents) to avoid bundling all markdown
  const relModules = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, unknown>
  const absModules = import.meta.glob('/src/content/**/*.md', { query: '?raw', import: 'default' }) as Record<string, unknown>
  const entries = [...Object.keys(relModules), ...Object.keys(absModules)]
  const set = new Set<string>()
  for (const p of entries) {
    // Normalize path like '/src/content/<collection>/.../file.md' or '../content/<collection>/...'
    const idx = p.indexOf('/content/')
    if (idx === -1) continue
    const after = p.slice(idx + '/content/'.length)
    const top = after.split('/')[0]
    if (top) set.add(top)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}
