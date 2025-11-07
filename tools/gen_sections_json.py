#!/usr/bin/env python3
"""
Generate sections.json from the files in policy/sections/*.md, using natural sort.

- Keeps existing sections.json order when all entries still exist, unless you pass --force.
- Appends any new files found to the end (unless --force is used).
- With --force, rewrites the list entirely from discovered files (natural sort).
"""
import json, sys, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECTIONS_DIR = ROOT / "policy" / "sections"
ORDER_FILE = ROOT / "sections.json"

def natural_key(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', s)]

def discover():
    if not SECTIONS_DIR.exists():
        return []
    return sorted([p.name for p in SECTIONS_DIR.glob("*.md")], key=natural_key)

def main():
    force = "--force" in sys.argv
    files = discover()

    if not files:
        print("No section files found at policy/sections/*.md", file=sys.stderr)
        sys.exit(0)

    if not ORDER_FILE.exists() or force:
        ORDER_FILE.write_text(json.dumps(files, indent=2), encoding="utf-8")
        print("Wrote sections.json (force=%s)" % force)
        return

    try:
        existing = json.loads(ORDER_FILE.read_text(encoding="utf-8"))
    except Exception:
        existing = []

    existing_filtered = [f for f in existing if f in files]
    new_files = [f for f in files if f not in existing_filtered]
    merged = existing_filtered + new_files

    if merged != existing:
        ORDER_FILE.write_text(json.dumps(merged, indent=2), encoding="utf-8")
        print("Updated sections.json with new files.")
    else:
        print("sections.json already up to date.")

if __name__ == "__main__":
    main()
