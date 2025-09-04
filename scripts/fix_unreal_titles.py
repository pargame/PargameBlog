#!/usr/bin/env python3
"""
Fix malformed title frontmatter in src/content/UnrealEngine/*.md

Behavior:
 - Scans markdown files under src/content/UnrealEngine
 - If a file has YAML frontmatter and a `title:` line whose value starts with a quote
   but does not end with the same quote, append the matching closing quote.
 - Makes an in-place edit and writes a backup with suffix `.bak` when changes are made.

Usage:
  python3 scripts/fix_unreal_titles.py [--dry-run]
"""
from pathlib import Path
import re
import argparse


def fix_frontmatter_title(text: str) -> tuple[str, bool]:
    """Return (new_text, changed) after fixing title line in frontmatter if needed."""
    fm_match = re.match(r"^---\s*\n(.*?)(?:\n---\s*\n)" , text, re.DOTALL)
    if not fm_match:
        return text, False

    fm = fm_match.group(1)
    changed = False
    new_fm_lines = []
    for line in fm.splitlines():
        m = re.match(r"^(\s*title\s*:\s*)(.*)$", line)
        if m:
            prefix = m.group(1)
            value = m.group(2).rstrip()
            if value.startswith(('"', "'")):
                opening = value[0]
                if not value.endswith(opening):
                    # append the missing closing quote
                    value = value + opening
                    changed = True
            # else: leave as-is
            new_line = prefix + value
            new_fm_lines.append(new_line)
        else:
            new_fm_lines.append(line)

    if not changed:
        return text, False

    new_fm = "\n".join(new_fm_lines)
    # replace first frontmatter block
    new_text = re.sub(r"^---\s*\n.*?(?:\n---\s*\n)", f"---\n{new_fm}\n---\n", text, count=1, flags=re.DOTALL)
    return new_text, True


def main(dry_run: bool):
    base = Path("src/content/UnrealEngine")
    if not base.exists():
        print(f"Directory not found: {base}")
        return

    md_files = sorted(base.rglob("*.md"))
    total = 0
    changed_files = []
    for p in md_files:
        total += 1
        text = p.read_text(encoding="utf-8")
        new_text, changed = fix_frontmatter_title(text)
        if changed:
            changed_files.append(str(p))
            print(("DRY: would change" if dry_run else "Changing"), p)
            if not dry_run:
                backup = p.with_suffix(p.suffix + ".bak")
                backup.write_text(text, encoding="utf-8")
                p.write_text(new_text, encoding="utf-8")

    print(f"Scanned {total} files. Modified {len(changed_files)} files.")
    if len(changed_files) > 0:
        for f in changed_files:
            print(" -", f)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', help='Show changes without writing files')
    args = ap.parse_args()
    main(args.dry_run)
