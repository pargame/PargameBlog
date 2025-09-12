#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const COVERAGE_FILE = path.resolve(__dirname, '..', 'coverage', 'coverage-final.json')
const patterns = [
  /src\/hooks\/useGraphSimulation\.ts$/,
]

function matches(filePath) {
  return patterns.some(p => p.test(filePath))
}

function pct(covered, total) {
  if (total === 0) return 100
  return Math.round((covered / total) * 100)
}

if (!fs.existsSync(COVERAGE_FILE)) {
  console.error('coverage-final.json not found; run tests with coverage first')
  process.exit(2)
}

const raw = fs.readFileSync(COVERAGE_FILE, 'utf8')
const data = JSON.parse(raw)

let failed = false
const report = []
for (const key of Object.keys(data)) {
  const rel = path.relative(process.cwd(), key).replace(/\\/g, '/')
  if (!matches(rel)) continue
  const item = data[key]
  const stmtTotal = Object.keys(item.statementMap || {}).length
  const stmtCovered = Object.values(item.s || {}).filter(v => v > 0).length
  const funcTotal = Object.keys(item.fnMap || {}).length
  const funcCovered = Object.values(item.f || {}).filter(v => v > 0).length
  const branchTotal = Object.keys(item.branchMap || {}).length
  const branchCovered = Object.values(item.b || {}).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.filter(v => v > 0).length : 0), 0)
  const stmtPct = pct(stmtCovered, stmtTotal)
  const funcPct = pct(funcCovered, funcTotal)
  let branchDenom = 1
  if (item.b && Object.values(item.b).length > 0 && Array.isArray(Object.values(item.b)[0])) {
    branchDenom = Object.values(item.b)[0].length
  }
  const branchPct = pct(branchCovered, branchTotal * branchDenom)
  const linesTotal = stmtTotal
  const linesCovered = stmtCovered
  const linesPct = pct(linesCovered, linesTotal)

  report.push({ file: rel, statements: stmtPct, functions: funcPct, branches: branchPct, lines: linesPct })
  if (stmtPct < 100 || funcPct < 100 || branchPct < 100 || linesPct < 100) failed = true
}

if (report.length === 0) {
  console.warn('No files matched coverage patterns; nothing to enforce')
  process.exit(1)
}

console.log('Coverage check report for selected files:')
report.forEach(r => console.log(`${r.file}: stmts=${r.statements}% funcs=${r.functions}% branches=${r.branches}% lines=${r.lines}%`))

if (failed) {
  console.error('\nCoverage gate failed: some files do not reach 100%')
  process.exit(1)
}

console.log('\nCoverage gate passed: selected files are 100% covered')
process.exit(0)
