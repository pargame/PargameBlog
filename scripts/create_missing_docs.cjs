#!/usr/bin/env node
"use strict";

/*
  scripts/create_missing_docs.cjs

  Node(CommonJS) port of create_missing_docs.py. Scans content/* for
  wikilinks like [[Target]] and creates missing Target.md files in the same
  collection folder. Conservative: only creates files in the same collection
  where the link was found.

  Usage:
    node scripts/create_missing_docs.cjs --dry-run
    node scripts/create_missing_docs.cjs -c Unreal
    node scripts/create_missing_docs.cjs
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

function findMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && p.endsWith('.md')) out.push(p);
    }
  }
  walk(dir);
  out.sort();
  return out;
}

function extractWikilinks(text) {
  const out = [];
  let m;
  while ((m = WIKILINK_RE.exec(text)) !== null) {
    let raw = m[1].trim();
    if (raw.includes('|')) raw = raw.split('|', 1)[0].trim();
    out.push(raw);
  }
  return out;
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, { encoding: 'utf8' });
  } catch (e) {
    return null;
  }
}

function writeFileSafe(p, body) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body, { encoding: 'utf8' });
}

function usage() {
  console.log('Usage: node scripts/create_missing_docs.cjs [--dry-run] [-c|--collection NAME]');
}

function parseArgs(argv) {
  const res = { dryRun: false, collection: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') res.dryRun = true;
    else if (a === '-c' || a === '--collection') {
      res.collection = argv[++i];
      i++;
    } else if (a === '-h' || a === '--help') {
      usage();
      process.exit(0);
    }
  }
  return res;
}

function main() {
  const args = parseArgs(process.argv);
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('Content directory not found:', CONTENT_DIR);
    return 1;
  }

  let markdownFiles;
  if (args.collection) {
    const collDir = path.join(CONTENT_DIR, args.collection);
    if (!fs.existsSync(collDir)) {
      console.error('Collection not found:', collDir);
      return 1;
    }
    markdownFiles = findMarkdownFiles(collDir);
  } else {
    markdownFiles = findMarkdownFiles(CONTENT_DIR);
  }

  const missingMap = new Map(); // candidatePath -> Set of refFiles

  for (const md of markdownFiles) {
    const text = readFileSafe(md);
    if (!text) continue;
    const links = extractWikilinks(text);
    if (!links.length) continue;
    const collectionDir = path.dirname(md);
    for (const link of links) {
      const candidate = path.join(collectionDir, `${link}.md`);
      if (!fs.existsSync(candidate)) {
        const key = path.resolve(candidate);
        if (!missingMap.has(key)) missingMap.set(key, new Set());
        missingMap.get(key).add(path.relative(CONTENT_DIR, md));
      }
    }
  }

  if (!missingMap.size) {
    console.log('No missing documents found.');
    return 0;
  }

  console.log(`Found ${missingMap.size} missing documents:`);
  for (const [candidate, refs] of missingMap.entries()) {
    console.log(' -', path.relative(ROOT, candidate), '(referenced from:', [...refs].join(', '), ')');
  }

  if (args.dryRun) {
    console.log('\nDry run: no files were created.');
    return 0;
  }

  // Try to inherit title from any existing file with same stem
  const allMd = findMarkdownFiles(path.join(ROOT));

  for (const [candidate, refs] of missingMap.entries()) {
    const stem = path.basename(candidate, '.md');
    let foundTitle = null;
    for (const other of allMd) {
      if (path.basename(other, '.md') !== stem) continue;
      const text = readFileSafe(other);
      if (!text) continue;
      const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
      if (!m) continue;
      const fm = m[1];
      const tm = fm.match(/^title:\s*["']?(.*?)["']?\s*$/m);
      if (tm) {
        foundTitle = tm[1].trim();
        break;
      }
    }
    const title = foundTitle || stem;
    const date = new Date().toISOString();
    const body = `---\ntitle: "${title}"\ndate: "${date}"\nexcerpt: ""\n---\n\n# ${title}\n\n(생성된 문서 — 원래는 수동으로 내용을 작성하세요.)\n`;
    try {
      writeFileSafe(candidate, body);
      console.log('Created', path.relative(ROOT, candidate));
    } catch (e) {
      console.error('Failed to create', candidate, e);
    }
  }

  console.log('\nDone.');
  return 0;
}

if (require.main === module) {
  const code = main();
  process.exit(typeof code === 'number' ? code : 0);
}
