#!/usr/bin/env python3
import json
import os
import re
from pathlib import Path
from typing import Optional, Tuple, List, Dict

RE_CATEGORY = re.compile(r"^\#\s+(.+?)\s*$")                 # first H1
RE_SECTION_H2 = re.compile(r"^\#\#\s*(Section\b.*)\s*$", re.I)  # first H2 starting with "Section"
RE_ANY_H2 = re.compile(r"^\#\#\s+(.+?)\s*$")                # fallback: first H2
RE_LEADING_NUM = re.compile(r"^\s*(\d+)[\-_ ]")             # order from filename like 01_ or 8- etc

def strip_front_matter(text: str) -> str:
    """
    Remove YAML front matter if present.
    Front matter is assumed to be:
      ---\n ... \n---\n
    at the start of the file.
    """
    if not text.startswith("---"):
        return text
    # Find the second --- delimiter
    parts = text.split("\n")
    if len(parts) < 3:
        return text
    if parts[0].strip() != "---":
        return text
    for i in range(1, len(parts)):
        if parts[i].strip() == "---":
            return "\n".join(parts[i + 1 :]).lstrip("\n")
    return text

def extract_category_and_title(md: str) -> Tuple[Optional[str], Optional[str]]:
    """
    md is content WITHOUT front matter.
    Returns (category, section_title).
    Category = first H1 (# ...)
    Section title = first H2 that starts with "Section", else first H2.
    """
    category = None
    section_title = None
    first_h2 = None

    for line in md.splitlines():
        line = line.rstrip()

        if category is None:
            m = RE_CATEGORY.match(line)
            if m:
                category = m.group(1).strip()
                continue

        if first_h2 is None:
            m2 = RE_ANY_H2.match(line)
            if m2:
                first_h2 = m2.group(1).strip()

        if section_title is None:
            ms = RE_SECTION_H2.match(line)
            if ms:
                section_title = ms.group(1).strip()
                # don't break; we still want to find category if it was later (rare)

        if category is not None and section_title is not None:
            break

    if section_title is None:
        section_title = first_h2

    return (category, section_title)

def infer_order_from_filename(name: str) -> int:
    """
    Use leading digits in filename to determine order. Falls back to a large number.
    Example: '01_Foo.md' => 1
             '8_Bar.md'  => 8
    """
    base = name
    if base.lower().endswith(".md"):
        base = base[:-3]
    m = RE_LEADING_NUM.match(base)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            pass
    return 10**9

def main() -> None:
    repo_root = Path(__file__).resolve().parent
    sections_dir = repo_root / "policy" / "sections"
    out_dir = repo_root / "_data"
    out_path = out_dir / "sections.json"

    if not sections_dir.exists():
        raise SystemExit(f"[build_docs] Missing sections dir: {sections_dir}")

    out_dir.mkdir(parents=True, exist_ok=True)

    section_files = sorted(sections_dir.glob("*.md"), key=lambda p: (infer_order_from_filename(p.name), p.name.lower()))
    items: List[Dict] = []

    for p in section_files:
        raw = p.read_text(encoding="utf-8", errors="replace")
        body = strip_front_matter(raw)

        category, section_title = extract_category_and_title(body)

        slug = p.stem  # filename without .md
        url = f"/policy/sections/{slug}/"

        order = infer_order_from_filename(p.name)

        items.append({
            "file": str(p.relative_to(repo_root)).replace("\\", "/"),
            "slug": slug,
            "url": url,
            "order": order,
            "category": category or "Uncategorized",
            "sectionTitle": section_title or slug.replace("_", " ").replace("-", " "),
        })

    # Secondary sort: category then order then title (optional, keeps output stable)
    items.sort(key=lambda x: (x["category"].lower(), x["order"], x["sectionTitle"].lower(), x["slug"].lower()))

    out_path.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[build_docs] Wrote {out_path} ({len(items)} sections)")

if __name__ == "__main__":
    main()