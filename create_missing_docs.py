#!/usr/bin/env python3
"""
create_missing_docs.py

Scan `src/content/*` directories for wikilink tokens like [[Target]] and create
missing Markdown files named `Target.md` in the same collection folder.

Usage:
  python create_missing_docs.py        # actually create missing files
  python create_missing_docs.py --dry-run  # only report which files would be created

Behavior:
- For every markdown file under `src/content/<collection>/`, the script finds
  occurrences of [[Target]] and treats `Target` as a filename `Target.md` in
  the same collection folder.
- If the target file already exists, it is skipped.
- Created files include a minimal frontmatter (title, date) and a short
  placeholder body mentioning the original source file(s) that referenced it.

This script is intentionally conservative: it only creates files in the same
collection folder where the wikilink was found.
"""

from __future__ import annotations
import argparse
import os
import re
from datetime import datetime
from pathlib import Path
from collections import defaultdict

WIKILINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")

ROOT = Path(__file__).resolve().parent
CONTENT_DIR = ROOT / 'src' / 'content'

FRONTMATTER_TMPL = """---
title: "{title}"
date: "{date}"
excerpt: ""

# {title}

(생성된 문서 — 원래는 수동으로 내용을 작성하세요.)

"""


def find_markdown_files(content_root: Path):
    if not content_root.exists():
        return []
    return sorted(content_root.rglob('*.md'))


def extract_wikilinks(text: str):
    out = []
    for m in WIKILINK_RE.finditer(text):
        raw = m.group(1).strip()
        # If alias form [[Target|Label]] is used, take the left 'Target'
        if '|' in raw:
            target = raw.split('|', 1)[0].strip()
        else:
            target = raw
        out.append(target)
    return out


def main(dry_run: bool = False, collection: str | None = None):
    if not CONTENT_DIR.exists():
        print(f"Content directory not found: {CONTENT_DIR}")
        return 1

    # If collection filter provided, limit scanning to that folder
    if collection:
        collection_dir = CONTENT_DIR / collection
        if not collection_dir.exists():
            print(f"Collection not found: {collection_dir}")
            return 1
        markdown_files = find_markdown_files(collection_dir)
    else:
        markdown_files = find_markdown_files(CONTENT_DIR)
    # Map target -> set of (collection_dir, referring_file)
    missing_map: dict[Path, set[Path]] = defaultdict(set)

    for md in markdown_files:
        try:
            text = md.read_text(encoding='utf-8')
        except Exception as e:
            print(f"Failed to read {md}: {e}")
            continue

        links = extract_wikilinks(text)
        if not links:
            continue

        collection_dir = md.parent
        for link in links:
            # Normalize filename: keep as-is but append .md
            candidate = collection_dir / f"{link}.md"
            if not candidate.exists():
                missing_map[candidate].add(md)

    if not missing_map:
        print('No missing documents found.')
        return 0

    print(f'Found {len(missing_map)} missing documents:')
    for candidate, ref_files in missing_map.items():
        refs = ', '.join(str(p.relative_to(CONTENT_DIR)) for p in sorted(ref_files))
        print(f' - {candidate.relative_to(ROOT)} (referenced from: {refs})')

    if dry_run:
        print('\nDry run: no files were created.')
        return 0

    # Create files
    for candidate, ref_files in missing_map.items():
        # Try to inherit title from any existing markdown with same stem
        title = candidate.stem
        # search for existing title in repo markdown files (posts or other collections)
        found_title = None
        for other in CONTENT_DIR.parent.rglob('*.md'):
            try:
                if other.stem != candidate.stem:
                    continue
                text = other.read_text(encoding='utf-8')
            except Exception:
                continue
            # look for YAML frontmatter block
            m = re.search(r'^---\s*\n(.*?)\n---\s*\n', text, re.S | re.M)
            if not m:
                continue
            fm = m.group(1)
            tm = re.search(r'^title:\s*["\']?(.*?)["\']?\s*$', fm, re.M)
            if tm:
                found_title = tm.group(1).strip()
                break
        if found_title:
            title = found_title
        date = datetime.now().isoformat()
        body = FRONTMATTER_TMPL.format(title=title, date=date)
        try:
            candidate.parent.mkdir(parents=True, exist_ok=True)
            candidate.write_text(body, encoding='utf-8')
            print(f'Created {candidate.relative_to(ROOT)}')
        except Exception as e:
            print(f'Failed to create {candidate}: {e}')

    print('\nDone.')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Create missing wiki-linked markdown files in src/content')
    parser.add_argument('--dry-run', action='store_true', help='Report missing files but do not create them')
    parser.add_argument('-c', '--collection', help='Only operate on a single collection folder under src/content')
    args = parser.parse_args()
    raise SystemExit(main(dry_run=args.dry_run, collection=args.collection))
