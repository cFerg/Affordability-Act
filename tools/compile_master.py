#!/usr/bin/env python3
import os, re, sys, datetime

# repo root
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
DEST = os.path.join(ROOT, "policy", "bill-text.md")

def sort_key(name):
    m = re.match(r"^(\d+)", name)
    return int(m.group(1)) if m else 9999

def read_text(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read().rstrip() + "\n"

def main():
    parts = []
    parts.append("# Price Reversion Act - Compiled Master\n")
    parts.append("_Generated (UTC): " + datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC") + "_\n\n")

    included = []
    if os.path.isdir(SECTIONS_DIR):
        folders = [d for d in os.listdir(SECTIONS_DIR) if os.path.isdir(os.path.join(SECTIONS_DIR, d))]
        folders.sort(key=sort_key)
        for d in folders:
            md = os.path.join(SECTIONS_DIR, d, "README.md")
            if os.path.isfile(md):
                parts.append(read_text(md))
                parts.append("\n---\n\n")
                included.append(d)

    os.makedirs(os.path.dirname(DEST), exist_ok=True)
    with open(DEST, "w", encoding="utf-8") as f:
        f.write("".join(parts).rstrip() + "\n")
    print("[compile_master] wrote", DEST)
    print("[compile_master] included sections:", included)
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        # never fail the job; write a minimal file
        os.makedirs(os.path.dirname(DEST), exist_ok=True)
        with open(DEST, "w", encoding="utf-8") as f:
            f.write("# Price Reversion Act - Compiled Master\n\n> Compilation error; see workflow logs.\n")
        print("[compile_master] ERROR:", e)
        sys.exit(0)
