#!/usr/bin/env python3
import os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
DEST = os.path.join(ROOT, "policy", "bill-text.md")

def sort_key(folder: str):
    m = re.match(r"^(\d+)", folder)
    return (int(m.group(1)) if m else 9999, folder.lower())

def read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read().rstrip() + "\n"

def build() -> str:
    parts = []
    parts.append("# Price Reversion Act — Compiled Master\n")
    parts.append(f"_Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}_\n\n")

    if not os.path.isdir(SECTIONS_DIR):
        parts.append("> _No sections directory found at `policy/sections/`._\n")
        return "".join(parts)

    folders = [d for d in os.listdir(SECTIONS_DIR) if os.path.isdir(os.path.join(SECTIONS_DIR, d))]
    folders.sort(key=sort_key)

    included, skipped = [], []
    for d in folders:
        md = os.path.join(SECTIONS_DIR, d, "README.md")
        if os.path.isfile(md):
            parts.append(read_text(md))
            parts.append("\n---\n\n")
            included.append(d)
        else:
            skipped.append(d)

    print(f"[compile_master] included {len(included)} sections:", included)
    if skipped:
        print(f"[compile_master] skipped (no README.md):", skipped)

    return "".join(parts).rstrip() + "\n"

def main():
    os.makedirs(os.path.dirname(DEST), exist_ok=Tr_
