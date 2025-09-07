#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')
const exts = ['.ts', '.tsx', '.js', '.jsx']
const DEFAULT_IGNORES = new Set(['node_modules', '.git', 'dist', 'build', 'public', 'out', '.vite'])

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { mode: 'advanced', root: ROOT }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--mode' || a === '-m') { opts.mode = args[++i] }
    else if (a.startsWith('--mode=')) opts.mode = a.split('=')[1]
    else if (a === '--root' || a === '-r') { opts.root = path.resolve(args[++i]) }
    else if (a.startsWith('--root=')) opts.root = path.resolve(a.split('=')[1])
    else if (a === '--help' || a === '-h') { opts.help = true }
  }
  return opts
}

function walk(dir, ignores = DEFAULT_IGNORES) {
  const files = []
  for (const name of fs.readdirSync(dir)) {
    if (ignores && ignores.has(name)) continue
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      files.push(...walk(full, ignores))
    } else if (exts.includes(path.extname(name))) {
      files.push(full)
    }
  }
  return files
}

function parseImports(content) {
  const imports = new Set()
  const re1 = /import\s+(?:[^'";]+)\s+from\s+['"]([^'"\)]+)['"]/g
  const re2 = /import\(\s*['"]([^'"\)]+)['"]\s*\)/g
  const re3 = /require\(\s*['"]([^'"\)]+)['"]\s*\)/g
  let m
  while ((m = re1.exec(content))) imports.add(m[1])
  while ((m = re2.exec(content))) imports.add(m[1])
  while ((m = re3.exec(content))) imports.add(m[1])
  return Array.from(imports)
}

function readTsconfigPaths(root) {
  try {
    const ts = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8'))
    const co = ts.compilerOptions || {}
    const baseUrl = co.baseUrl ? path.resolve(root, co.baseUrl) : root
    const paths = co.paths || {}
    const mappings = []
    for (const [key, arr] of Object.entries(paths)) {
      const star = key.indexOf('*') >= 0
      const prefix = star ? key.replace('*', '') : key
      const targets = arr.map(t => {
        const tstar = t.indexOf('*') >= 0
        const tprefix = tstar ? t.replace('*', '') : t
        return path.resolve(baseUrl, tprefix)
      })
      mappings.push({ key, prefix, targets, hasStar: star })
    }
    return mappings
  } catch (e) {
    return []
  }
}

function resolveImport(fromFile, imp, tsPaths) {
  // relative or absolute file path
  if (imp.startsWith('.') || imp.startsWith('/')) {
    const base = path.dirname(fromFile)
    let resolved = path.resolve(base, imp)
    for (const e of [''].concat(exts)) {
      const tryPath = resolved + e
      if (fs.existsSync(tryPath) && fs.statSync(tryPath).isFile()) return tryPath
      const tryIndex = path.join(resolved, 'index' + e)
      if (fs.existsSync(tryIndex) && fs.statSync(tryIndex).isFile()) return tryIndex
    }
    return null
  }

  // optional tsconfig path mappings
  if (tsPaths && tsPaths.length) {
    for (const m of tsPaths) {
      if (m.hasStar) {
        if (imp.startsWith(m.prefix)) {
          const suffix = imp.slice(m.prefix.length)
          for (const tgt of m.targets) {
            const candidate = path.join(tgt, suffix)
            for (const e of [''].concat(exts)) {
              const tryPath = candidate + e
              if (fs.existsSync(tryPath) && fs.statSync(tryPath).isFile()) return tryPath
              const tryIndex = path.join(candidate, 'index' + e)
              if (fs.existsSync(tryIndex) && fs.statSync(tryIndex).isFile()) return tryIndex
            }
          }
        }
      } else {
        if (imp === m.prefix || imp === m.key) {
          for (const tgt of m.targets) {
            for (const e of [''].concat(exts)) {
              const tryPath = tgt + e
              if (fs.existsSync(tryPath) && fs.statSync(tryPath).isFile()) return tryPath
              const tryIndex = path.join(tgt, 'index' + e)
              if (fs.existsSync(tryIndex) && fs.statSync(tryIndex).isFile()) return tryIndex
            }
          }
        }
      }
    }
  }

  return null
}

function textSearchForFileUsage(filePath, allFiles, root) {
  const name = path.basename(filePath)
  const rel = path.relative(root || ROOT, filePath)
  for (const f of allFiles) {
    if (f === filePath) continue
    try {
      const txt = fs.readFileSync(f, 'utf8')
      if (txt.includes(name) || txt.includes(rel) || txt.includes(rel.replace(/\\/g, '/'))) return true
    } catch (e) {}
  }
  return false
}

function buildGraph(allFiles, tsPaths) {
  const importsMap = new Map()
  for (const f of allFiles) {
    let src = ''
    try { src = fs.readFileSync(f, 'utf8') } catch (e) { continue }
    const imps = parseImports(src).map(i => ({ raw: i, resolved: resolveImport(f, i, tsPaths) }))
    importsMap.set(f, imps.filter(x => x.resolved).map(x => x.resolved))
  }

  const importedBy = new Map()
  for (const f of allFiles) importedBy.set(f, new Set())
  for (const [from, tos] of importsMap.entries()) {
    for (const to of tos) {
      if (!importedBy.has(to)) importedBy.set(to, new Set())
      importedBy.get(to).add(from)
    }
  }
  return { importsMap, importedBy }
}

function computeRoots(root, mode, allFiles) {
  const roots = []
  const candidates = ['src/main.tsx', 'src/main.ts', 'src/index.tsx', 'src/index.ts', 'src/App.tsx', 'src/App.ts', 'index.html']
  for (const c of candidates) {
    const p = path.join(root, c)
    if (fs.existsSync(p)) roots.push(p)
  }
  for (const f of allFiles) {
    if (mode === 'files') {
      if (f.includes(path.join('src','pages')) || f.includes(path.join('src','lib'))) roots.push(f)
    } else {
      if (f.includes(path.join('src', 'pages')) || f.includes(path.join('src', 'lib')) || f.includes(path.join('src', 'content'))) roots.push(f)
    }
  }
  return roots
}

async function main() {
  const opts = parseArgs()
  if (opts.help) {
    console.log('Usage: node scripts/find-unused.cjs [--mode files|full|advanced] [--root /path/to/repo]')
    process.exit(0)
  }
  const mode = opts.mode || 'advanced'
  const root = opts.root || ROOT

  let ignores = DEFAULT_IGNORES
  if (mode === 'files') {
    // restrict to src only
    if (!fs.existsSync(path.join(root, 'src'))) { console.error('src directory not found'); process.exit(1) }
    const allFiles = walk(path.join(root, 'src'), null)
    const tsPaths = []
    const { importsMap } = buildGraph(allFiles, tsPaths)
    const ROOTS = computeRoots(root, 'files', allFiles)
    const used = new Set()
    const q = [...ROOTS]
    for (const r of q) used.add(r)
    while (q.length) {
      const cur = q.shift()
      const tos = importsMap.get(cur) || []
      for (const to of tos) {
        if (!used.has(to)) { used.add(to); q.push(to) }
      }
    }
    const unused = allFiles.filter(f => !used.has(f))
    console.log('# mode: files')
    console.log('# roots analyzed: ' + ROOTS.length)
    console.log('# total files under src: ' + allFiles.length)
    console.log('# used files: ' + used.size)
    console.log('# unused candidate files: ' + unused.length)
    if (unused.length) { console.log('\n=== UNUSED CANDIDATES ===\n'); for (const u of unused) console.log(u) }
    return
  }

  // full or advanced
  if (!fs.existsSync(root)) { console.error('root not found:', root); process.exit(1) }
  const allFiles = walk(root, DEFAULT_IGNORES)
  const tsPaths = mode === 'advanced' ? readTsconfigPaths(root) : []
  const { importsMap } = buildGraph(allFiles, tsPaths)
  const roots = computeRoots(root, mode, allFiles)

  const used = new Set()
  const q = [...roots]
  for (const r of q) used.add(r)
  while (q.length) {
    const cur = q.shift()
    const tos = importsMap.get(cur) || []
    for (const to of tos) {
      if (!used.has(to)) { used.add(to); q.push(to) }
    }
  }

  // heuristics: text search to catch dynamic usages
  for (const f of allFiles) {
    if (used.has(f)) continue
    const found = textSearchForFileUsage(f, allFiles, root)
    if (found) used.add(f)
  }

  const unused = allFiles.filter(f => !used.has(f))
  console.log('# mode:', mode)
  console.log('# tsconfig path mappings:', tsPaths.length)
  console.log('# roots analyzed: ' + roots.length)
  console.log('# total files scanned: ' + allFiles.length)
  console.log('# used files: ' + used.size)
  console.log('# unused candidate files: ' + unused.length)
  if (unused.length) { console.log('\n=== UNUSED CANDIDATES ===\n'); for (const u of unused) console.log(u) }

  // write JSON only in advanced mode
  if (mode === 'advanced') {
    try {
      fs.writeFileSync(path.join(root, 'unused-candidates.json'), JSON.stringify({ scanned: allFiles.length, used: [...used], unused }, null, 2))
      console.log('wrote unused-candidates.json')
    } catch (e) { console.error('failed to write json', e.message) }
  }
}

if (require.main === module) main().catch(err => { console.error(err); process.exitCode = 1 })
