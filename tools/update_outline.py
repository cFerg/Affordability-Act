#!/usr/bin/env python3
import os, re, sys, json, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
OUTLINE = os.path.join(ROOT, "policy", "outline.md")
SHORT_SHA = os.getenv("GITHUB_SHA", "")[:7]

def sort_key(name):
    m = re.match(r"^(\d+)", name)
    return int(m.group(1)) if m else 9999

def read_h1(path, fallback):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                if line.lstrip().startswith("#"):
                    return re.sub(r"^#+\s*", "", line).strip()
    except FileNotFoundError:
        pass
    return re.sub(r"_+", " ", fallback).strip()

def discover():
    items, dbg = [], {"dir": SECTIONS_DIR, "items": []}
    if os.path.isdir(SECTIONS_DIR):
        for d in os.listdir(SECTIONS_DIR):
            p = os.path.join(SECTIONS_DIR, d)
            if not os.path.isdir(p): 
                continue
            md = os.path.join(p, "README.md")
            title = read_h1(md, d)
            m = re.match(r"^(\d+)", d)
            num = f"{int(m.group(1)):02d}" if m else "—"
            rel = f"sections/{d}/README.md"
            items.append((num, title, rel))
            dbg["items"].append({"folder": d, "num": num, "title": title, "md_exists": os.path.exists(md)})
    items.sort(key=lambda t: (9999 if t[0]=="—" else int(t[0]), t[1].lower()))
    return items, dbg

def sections_md(items):
    if not items:
        return "_No sections discovered under `policy/sections/`._\n"
    return "\n".join([f"- {n} — [{t}]({r})" for (n,t,r) in items]) + "\n"

def stamp():
    now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    sha = f" · commit {SHORT_SHA}" if SHORT_SHA else ""
    return f"_Last updated: {now}{sha}_"

def main():
    items, dbg = discover()
    print("[update_outline] discovered:", json.dumps(dbg, indent=2))
    blk = sections_md(items)
    header = "# Price Reversion Act — Outline\n\n" + stamp() + "\n\n"
    body = "## Sections\n\n<!-- BEGIN:SECTION_INDEX -->\n" + blk + "<!-- END:SECTION_INDEX -->\n"
    text = header + body

    os.makedirs(os.path.dirname(OUTLINE), exist_ok=True)
    with open(OUTLINE, "w", encoding="utf-8") as f:
        f.write(text)
    print("[update_outline] wrote policy/outline.md")
    print("[update_outline] sections block:\n" + blk)

if __name__ == "__main__":
    sys.exit(main())
