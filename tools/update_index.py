#!/usr/bin/env python3
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(__file__))
SECTIONS_DIR = os.path.join(ROOT, "policy", "sections")
README = os.path.join(ROOT, "policy", "README.md")

def sort_key(name: str):
    m = re.match(r"^(\d+)", name)
    return int(m.group(1)) if m else 9999

def read_h1(md_path: str, fallback: str) -> str:
    try:
        with open(md_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.lstrip().startswith("#"):
                    # strip leading #'s and whitespace
                    return re.sub(r"^#+\s*", "", line).strip()
    except FileNotFoundError:
        pass
    # prettify fallback like "01_definitions_and_valuation" -> "01 — Definitions And Valuation"
    pretty = re.sub(r"_+", " ", fallback)
    return pretty

def build_list() -> str:
    if not os.path.isdir(SECTIONS_DIR):
        return ""
    folders = [d for d in os.listdir(SECTIONS_DIR) if os.path.isdir(os.path.join(SECTIONS_DIR, d))]
    folders.sort(key=sort_key)
    lines = []
    for d in folders:
        md = os.path.join(SECTIONS_DIR, d, "README.md")
        title = read_h1(md, d)
        # extract numeric prefix if present
        m = re.match(r"^(\d+)", d)
        num = f"{int(m.group(1)):02d}" if m else "—"
        rel = f"sections/{d}/README.md"
        lines.append(f"- {num} — [{title}]({rel})")
    return "\n".join(lines) + "\n"

def ensure_readme_skeleton():
    if os.path.exists(README):
        with open(README, "r", encoding="utf-8") as f:
            return f.read()
    # create a minimal skeleton if missing
    return (
        "# Policy\n\n"
        "**Start here → [Master Bill (compiled)](./bill-text.md)** • "
        "[Outline](./outline.md)\n\n"
        "## Sections\n\n"
        "<!-- BEGIN:SECTION_INDEX -->\n"
        "<!-- END:SECTION_INDEX -->\n"
    )

def replace_index(doc: str, new_index_md: str) -> str:
    # Case A: replace between markers
    if "<!-- BEGIN:SECTION_INDEX -->" in doc and "<!-- END:SECTION_INDEX -->" in doc:
        return re.sub(
            r"(<!-- BEGIN:SECTION_INDEX -->)(.*?)(<!-- END:SECTION_INDEX -->)",
            r"\1\n" + new_index_md + r"\3",
            doc,
            flags=re.DOTALL,
        )
    # Case B: replace the block after "## Sections" up to next "## " or EOF
    m = re.search(r"(?ms)^##\s+Sections\s*$", doc)
    if m:
        start = m.end()
        # find next heading at same or higher level
        n = re.search(r"(?m)^\s*##\s+", doc[start:])
        if n:
            end = start + n.start()
        else:
            end = len(doc)
        return doc[:start] + "\n\n" + new_index_md + doc[end:]
    # Case C: append a sections block
    return doc.rstrip() + "\n\n## Sections\n\n<!-- BEGIN:SECTION_INDEX -->\n" + new_index_md + "<!-- END:SECTION_INDEX -->\n"

def main():
    idx = build_list()
    doc = ensure_readme_skeleton()
    new_doc = replace_index(doc, idx)
    if new_doc != doc:
        os.makedirs(os.path.dirname(README), exist_ok=True)
        with open(README, "w", encoding="utf-8") as f:
            f.write(new_doc)
        print("Updated policy/README.md")
    else:
        print("No changes to policy/README.md")

if __name__ == "__main__":
    sys.exit(main())
