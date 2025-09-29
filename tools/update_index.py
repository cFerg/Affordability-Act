#!/usr/bin/env python3
import os, re

ROOT = os.path.dirname(os.path.dirname(__file__))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
README = os.path.join(ROOT, "policy", "README.md")

MARKER_BEGIN = r"<!--\s*BEGIN:\s*SECTION_INDEX\s*-->"
MARKER_END   = r"<!--\s*END:\s*SECTION_INDEX\s*-->"

def sort_key(name: str):
    m = re.match(r"^(\d+)", name)
    return int(m.group(1)) if m else 9999

def read_h1(md_path: str, fallback: str) -> str:
    try:
        with open(md_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.lstrip().startswith("#"):
                    return re.sub(r"^#+\s*", "", line).strip()
    except FileNotFoundError:
        pass
    return re.sub(r"_+", " ", fallback)

def build_list() -> str:
    if not os.path.isdir(SECTIONS_DIR):
        return ""
    folders = [d for d in os.listdir(SECTIONS_DIR) if os.path.isdir(os.path.join(SECTIONS_DIR, d))]
    folders.sort(key=sort_key)
    lines = []
    for d in folders:
        md = os.path.join(SECTIONS_DIR, d, "README.md")
        title = read_h1(md, d)
        m = re.match(r"^(\d+)", d)
        num = f"{int(m.group(1)):02d}" if m else "—"
        rel = f"sections/{d}/README.md"
        lines.append(f"- {num} — [{title}]({rel})")
    return "\n".join(lines) + "\n"

def ensure_readme():
    if os.path.exists(README):
        with open(README, "r", encoding="utf-8") as f:
            return f.read()
    os.makedirs(os.path.dirname(README), exist_ok=True)
    return (
        "# Policy\n\n"
        "**Start here → [Master Bill (compiled)](./bill-text.md)** • [Outline](./outline.md)\n\n"
        "## Sections\n\n"
        "<!-- BEGIN:SECTION_INDEX -->\n"
        "<!-- END:SECTION_INDEX -->\n"
    )

def replace_between_markers(doc: str, new_idx: str) -> str:
    pattern = re.compile(f"({MARKER_BEGIN})(.*?)({MARKER_END})", re.DOTALL | re.IGNORECASE)
    if pattern.search(doc):
        return pattern.sub(rf"\1\n{new_idx}\3", doc)
    return doc

def replace_after_heading(doc: str, new_idx: str) -> str:
    # case-insensitive match of a line that starts with "## Sections"
    m = re.search(r"(?mi)^\s*##\s*Sections\s*$", doc)
    if not m:
        return doc
    start = m.end()
    # find next H2+ heading or markers/end of file
    n = re.search(r"(?m)^\s*##\s+|"+MARKER_END, doc[start:], re.IGNORECASE)
    end = start + n.start() if n else len(doc)
    return doc[:start] + "\n\n" + new_idx + doc[end:]

def append_block(doc: str, new_idx: str) -> str:
    return doc.rstrip() + "\n\n## Sections\n\n<!-- BEGIN:SECTION_INDEX -->\n" + new_idx + "<!-- END:SECTION_INDEX -->\n"

def main():
    idx = build_list()
    doc = ensure_readme()

    # 1) Try markers (any case/whitespace)
    new_doc = replace_between_markers(doc, idx)

    # 2) If unchanged, try heading-based replace (case-insensitive)
    if new_doc == doc:
        new_doc = replace_after_heading(doc, idx)

    # 3) If still unchanged, append a standard block
    if new_doc == doc:
        new_doc = append_block(doc, idx)

    if new_doc != doc:
        with open(README, "w", encoding="utf-8") as f:
            f.write(new_doc)
        print("Updated policy/README.md")
    else:
        print("No changes to policy/README.md")

if __name__ == "__main__":
    main()
