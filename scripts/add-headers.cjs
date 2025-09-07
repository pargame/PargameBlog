#!/usr/bin/env node
/* Adds a small JSDoc-style header to source files under src/ that don't already have one.
   It uses a simple heuristic to create a one-line responsibility based on filename and first export.
*/
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')
const exts = new Set(['.ts', '.tsx', '.js', '.jsx'])

function walk(dir) {
  const files = []
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist' || name === 'build') continue
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) files.push(...walk(full))
    else if (exts.has(path.extname(name))) files.push(full)
  }
  return files
}

function inferRole(relPath, src) {
  // Try to infer main export name
  const m1 = src.match(/export\s+default\s+function\s+(\w+)/)
  if (m1) return `Responsibility: Default export function ${m1[1]}`
  const m2 = src.match(/export\s+default\s+(\w+)/)
  if (m2) return `Responsibility: Default export ${m2[1]}`
  const m3 = src.match(/export\s+(?:const|function)\s+(\w+)/)
  if (m3) return `Responsibility: Exports ${m3[1]}`
  const base = path.basename(relPath)
  const name = base.replace(/\.[^.]+$/, '')
  return `Responsibility: ${name}`
}

const files = walk(SRC)
let changed = 0
for (const f of files) {
  const rel = path.relative(ROOT, f)
  let src = fs.readFileSync(f, 'utf8')
  // skip if already has header with file path
  if (/^\/\*\*\s*\n\s*\*\s*src\//.test(src)) continue
  // also skip if starts with shebang
  if (src.startsWith('#!')) {
    // move shebang then add header after
    const idx = src.indexOf('\n') + 1
    const shebang = src.slice(0, idx)
    const rest = src.slice(idx)
    const header = `/**\n * ${rel}\n * ${inferRole(rel, rest)}\n * Auto-generated header: add more descriptive responsibility by hand.\n */\n\n`
    fs.writeFileSync(f, shebang + header + rest, 'utf8')
    changed++
    continue
  }
  const header = `/**\n * ${rel}\n * ${inferRole(rel, src)}\n * Auto-generated header: add more descriptive responsibility by hand.\n */\n\n`
  fs.writeFileSync(f, header + src, 'utf8')
  changed++
}
console.log(`added headers to ${changed} files`)
