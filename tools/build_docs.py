#!/usr/bin/env python3
import os, re, sys, json, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
BILL_PATH    = os.path.join(ROOT, "policy", "bill-text.md")
README_PATH  = os.path.join(ROOT, "policy", "README.md")
OUTLINE_PATH = os.path.join(ROOT, "policy", "outline.md")
SHORT_SHA    = os.getenv("GITHUB_SHA", "")[:7]

def sort_key(name):
    m = re.match(r"^(\d+)", name)
    return int(m.group(1)) if m else 9999

def list_sections():
    items, dbg = [], {"dir": SECTIONS_DIR, "folders": []}
    if not os.path.isdir(SECTIONS_DIR):
        return [], dbg
    for d in os.listdir(SECTIONS_DIR):
        p = os.path.join(SECTIONS_DIR, d)
        if not os.path.isdir(p): 
            continue
        md = os.path.join(p, "README.md")
        md_exists = os.path.isfile(md)
        title = None
        if md_exists:
            with open(md, "r", encoding="utf-8", errors="replace") as f:
                for line in f:
                    if line.lstrip().startswith("#"):
                        title = re.sub(r"^#+\s*", "", line).strip()
                        break
        if not title:
            title = re.sub(r"_+", " ", d).strip()
        m = re.match(r"^(\d+)", d)
        num = f"{int(m.group(1)):02d}" if m else "—"
        rel = f"sections/{d}/README.md"
        items.append((num, title, rel, md_exists, d))
        dbg["folders"].append({"folder": d, "num": num, "title": title, "md_exists": md_exists})
    items.sort(key=lambda t: (9999 if t[0]=="—" else int(t[0]), t[1].lower()))
    return items, dbg

def compile_bill(items):
    parts = []
    parts.append("# Price Reversion Act - Compiled Master\n")
    parts.append("_Generated (UTC): " + datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC") + "_\n\n")
    for (_, _, rel, md_exists, d) in items:
        md_path = os.path.join(SECTIONS_DIR, d, "README.md")
        if md_exists:
            with open(md_path, "r", encoding="utf-8", errors="replace") as f:
                parts.append(f.read().rstrip() + "\n")
                parts.append("\n---\n\n")
    text = "".join(parts).rstrip() + "\n"
    os.makedirs(os.path.dirname(BILL_PATH), exist_ok=True)
    with open(BILL_PATH, "w", encoding="utf-8") as f:
        f.write(text)
    print("[build_docs] wrote", BILL_PATH)

def sections_block(items):
    if not items:
        return "_No sections discovered under `policy/sections/`._\n"
    return "\n".join([f"- {n} — [{t}]({r})" for (n,t,r,_,_) in items]) + "\n"

def render_readme(items):
    header = (
        "# Policy\n\n"
        "**Start here → [Master Bill (compiled)](./bill-text.md)** • [Outline](./outline.md)\n\n"
    )
    body = "## Sections\n\n<!-- BEGIN:SECTION_INDEX -->\n" + sections_block(items) + "<!-- END:SECTION_INDEX -->\n"
    text = header + body
    os.makedirs(os.path.dirname(README_PATH), exist_ok=True)
    with open(README_PATH, "w", encoding="utf-8") as f:
        f.write(text)
    print("[build_docs] wrote", README_PATH)

def render_outline(items):
    stamp = "_Last updated: " + datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    if SHORT_SHA: stamp += f" · commit {SHORT_SHA}_"
    else: stamp += "_"
    header = "# Price Reversion Act — Outline\n\n" + stamp + "\n\n"
    body = "## Sections\n\n<!-- BEGIN:SECTION_INDEX -->\n" + sections_block(items) + "<!-- END:SECTION_INDEX -->\n"
    text = header + body
    os.makedirs(os.path.dirname(OUTLINE_PATH), exist_ok=True)
    with open(OUTLINE_PATH, "w", encoding="utf-8") as f:
        f.write(text)
    print("[build_docs] wrote", OUTLINE_PATH)

def main():
    items, dbg = list_sections()
    print("[build_docs] discovered sections:", json.dumps(dbg, indent=2))
    compile_bill(items)
    render_readme(items)
    render_outline(items)
    # Echo a preview into logs
    with open(README_PATH, "r", encoding="utf-8") as f:
        print("----- policy/README.md (top) -----")
        for i, line in enumerate(f.readlines()[:60], 1):
            print(f"{i:02d}: {line.rstrip()}")

if __name__ == "__main__":
    sys.exit(main())
