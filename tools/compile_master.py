#!/usr/bin/env python3
import os, re

ROOT = os.path.dirname(os.path.dirname(__file__))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
OUT_FILE = os.path.join(ROOT, "policy", "bill-text.md")

def sort_key(name):
    m = re.match(r"^(\d+)", name)
    return int(m.group(1)) if m else 9999

folders = [d for d in os.listdir(SECTIONS_DIR) if os.path.isdir(os.path.join(SECTIONS_DIR, d))]
folders.sort(key=sort_key)

parts = []
for d in folders:
    md = os.path.join(SECTIONS_DIR, d, "README.md")
    if os.path.exists(md):
        with open(md, "r", encoding="utf-8") as f:
            parts.append(f.read().strip())

doc = "\n\n---\n\n".join(parts) + "\n"
os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(doc)

print(f"Wrote {OUT_FILE} from {len(parts)} sections")
