// Utility to list top-level collections under src/content based on markdown files
export function listContentCollections(): string[] {
  // Find any markdown under src/content/** and infer the first folder after content/
  const rel = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
  const abs = import.meta.glob('/src/content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string | { default: string }>
  const entries = [...Object.keys(rel), ...Object.keys(abs)]
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
