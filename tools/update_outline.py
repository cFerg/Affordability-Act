#!/usr/bin/env python3
import os, re, sys, json, datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
OUTLINE = os.path.join(ROOT, "policy", "outline.md")
SHORT_SHA = os.getenv("GITHUB_SHA", "")[:7]

def sort_key(name: str):
    m = re.match(r"^(\d+)", name)
    return int(m.group(1)) if m else 9999

def read_h1(path: str, fallback: str) -> str:
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
            items.append((num, title, rel, os.path.exists(md)))
            dbg["items"].append({"folder": d, "num": num, "title": title, "md_exists": os.path.exists(md)})
    items.sort(key=lambda t: (9999 if t[0]=="—" else int(t[0]), t[1].lower()))
    return items, dbg

def sections_md(items):
    if not items:
        return "_No sections discovered under `policy/sections/`._\n"
    return "\n".join([f"- {n} — [{t}]({r})" for (n,t,r,_) in items]) + "\n"

def stamp():
    now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    sha = f" · commit {SHORT_SHA}" if SHORT_SHA else ""
    return f"_Last updated: {now}{sha}_"

def skeleton():
    return "# Price Reversion Act — Outline\n\n" + stamp() + "\n\n"

def main():
    items, dbg = discover()
    print("[update_outline] discovered:", json.dumps(dbg, indent=2))
    block = sections_md(items)
    stamp_line = stamp()

    if os.path.exists(OUTLINE):
        with open(OUTLINE, "r", encoding="utf-8", errors="replace") as f:
            doc = f.read()
    else:
        doc = skeleton()

    # ensure timestamp line under first H1
    if re.search(r"(?m)^_Last updated:.*_$", doc):
        doc = re.sub(r"(?m)^_Last updated:.*_$", stamp_line, doc)
    else:
        m = re.search(r"(?m)^#\s+.*$", doc)
        if m:
            pos = m.end()
            doc = doc[:pos] + "\n\n" + stamp_line + doc[pos:]
        else:
            doc = stamp_line + "\n\n" + doc

    # replace/append Sections block
    m = re.search(r"(?mi)^\s*##\s*Sections\s*$", doc)
    top = (doc[:m.start()].rstrip() + "\n\n") if m else (doc.rstrip() + "\n\n")
    new_doc = top + "## Sections\n\n<!-- BEGIN:SECTION_INDEX -->\n" + block + "<!-- END:SECTION_INDEX -->\n"

    if new_doc != doc:
        os.makedirs(os.path.dirname(OUTLINE), exist_ok=True)
        with open(OUTLINE, "w", encoding="utf-8") as f:
            f.write(new_doc)
        print("[update_outline] wrote policy/outline.md")
    else:
        print("[update_outline] no change")

if __name__ == "__main__":
    sys.exit(main())
