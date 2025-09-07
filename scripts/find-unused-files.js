/* eslint-disable */
// #!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const exts = ['.ts', '.tsx', '.js', '.jsx'];

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (exts.includes(path.extname(name))) {
      files.push(full);
    }
  }
  return files;
}

function parseImports(content) {
  const imports = new Set();
  // import ... from '...'
  const re1 = /import\s+(?:[^'";]+)\s+from\s+['"]([^'"]+)['"]/g;
  // import('...') dynamic
  const re2 = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  // require('...')
  const re3 = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

  let m;
  while ((m = re1.exec(content))) imports.add(m[1]);
  while ((m = re2.exec(content))) imports.add(m[1]);
  while ((m = re3.exec(content))) imports.add(m[1]);
  return Array.from(imports);
}

function resolveImport(fromFile, imp) {
  if (imp.startsWith('.') || imp.startsWith('/')) {
    const base = path.dirname(fromFile);
    let resolved = path.resolve(base, imp);
    // try with extensions
    for (const e of [''].concat(exts)) {
      // direct file
      const tryPath = resolved + e;
      if (fs.existsSync(tryPath) && fs.statSync(tryPath).isFile()) return tryPath;
      // index file in dir
      const tryIndex = path.join(resolved, 'index' + e);
      if (fs.existsSync(tryIndex) && fs.statSync(tryIndex).isFile()) return tryIndex;
    }
    return null;
  }
  return null; // non-relative (node_modules / aliased) - ignore
}

const allFiles = walk(SRC);
const importsMap = new Map();
for (const f of allFiles) {
  const src = fs.readFileSync(f, 'utf8');
  const imps = parseImports(src).map(i => ({raw:i, resolved: resolveImport(f, i)}));
  importsMap.set(f, imps.filter(x=>x.resolved).map(x=>x.resolved));
}

// Build reverse graph
const importedBy = new Map();
for (const f of allFiles) importedBy.set(f, new Set());
for (const [from, tos] of importsMap.entries()) {
  for (const to of tos) {
    if (!importedBy.has(to)) importedBy.set(to, new Set());
    importedBy.get(to).add(from);
  }
}

// Roots: main entry points we consider always used
const roots = [];
const candidates = ['src/main.tsx', 'src/main.ts', 'src/index.tsx', 'src/index.ts', 'src/App.tsx', 'src/App.ts'];
for (const c of candidates) {
  const p = path.join(ROOT, c);
  if (fs.existsSync(p)) roots.push(p);
}
// Also treat pages and lib as roots (files under src/pages and src/lib that might be entry-ish)
for (const f of allFiles) {
  if (f.includes(path.join('src','pages')) || f.includes(path.join('src','lib'))) roots.push(f);
}

// BFS from roots following imports
const used = new Set();
const q = [...roots];
for (const r of q) used.add(r);
while (q.length) {
  const cur = q.shift();
  const tos = importsMap.get(cur) || [];
  for (const to of tos) {
    if (!used.has(to)) { used.add(to); q.push(to); }
  }
}

const unused = allFiles.filter(f => !used.has(f));

console.log('# roots analyzed: ' + roots.length);
console.log('# total files under src: ' + allFiles.length);
console.log('# used files: ' + used.size);
console.log('# unused candidate files: ' + unused.length);
if (unused.length) {
  console.log('\n=== UNUSED CANDIDATES ===\n');
  for (const u of unused) console.log(u);
}

// exit code 0 even if unused found
