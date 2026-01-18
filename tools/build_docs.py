#!/usr/bin/env python3
import json
import os
import re
from pathlib import Path
from typing import Optional, Tuple, List, Dict

RE_CATEGORY = re.compile(r"^\#\s+(.+?)\s*$")                      # first H1
RE_SECTION_H2 = re.compile(r"^\#\#\s*(Section\b.*)\s*$", re.I)    # first H2 starting with "Section"
RE_ANY_H2 = re.compile(r"^\#\#\s+(.+?)\s*$")                      # fallback: first H2
RE_LEADING_NUM = re.compile(r"^\s*(\d+)[\-_ ]")                   # order from filename like 01_ or 8- etc

def find_repo_root(start: Path) -> Path:
    """
    Try to find the repository root that contains policy/sections.
    Priority:
      1) GITHUB_WORKSPACE (GitHub Actions)
      2) Walk upwards from start until policy/sections exists
    """
    ws = os.environ.get("GITHUB_WORKSPACE")
    if ws:
        p = Path(ws).resolve()
        if (p / "policy" / "sections").exists():
            return p

    cur = start.resolve()
    for _ in range(8):  # plenty for your structure
        if (cur / "policy" / "sections").exists():
            return cur
        cur = cur.parent

    raise SystemExit(f"[build_docs] Could not find repo root containing policy/sections starting from {start}")

def strip_front_matter(text: str) -> str:
    if not text.startswith("---"):
        return text
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return text
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return "\n".join(lines[i + 1 :]).lstrip("\n")
    return text

def extract_category_and_title(md: str) -> Tuple[Optional[str], Optional[str]]:
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

        if category is not None and section_title is not None:
            break

    if section_title is None:
        section_title = first_h2

    return (category, section_title)

def infer_order_from_filename(name: str) -> int:
    base = name[:-3] if name.lower().endswith(".md") else name
    m = RE_LEADING_NUM.match(base)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            pass
    return 10**9

def main() -> None:
    script_dir = Path(__file__).resolve().parent
    repo_root = find_repo_root(script_dir)

    sections_dir = repo_root / "policy" / "sections"
    out_dir = repo_root / "_data"
    out_path = out_dir / "sections.json"

    out_dir.mkdir(parents=True, exist_ok=True)

    section_files = sorted(
        sections_dir.glob("*.md"),
        key=lambda p: (infer_order_from_filename(p.name), p.name.lower())
    )

    items: List[Dict] = []

    for p in section_files:
        raw = p.read_text(encoding="utf-8", errors="replace")
        body = strip_front_matter(raw)

        category, section_title = extract_category_and_title(body)

        slug = p.stem
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

    # stable ordering in the JSON output
    items.sort(key=lambda x: (x["category"].lower(), x["order"], x["sectionTitle"].lower(), x["slug"].lower()))

    out_path.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[build_docs] Repo root: {repo_root}")
    print(f"[build_docs] Wrote {out_path} ({len(items)} sections)")

if __name__ == "__main__":
    main()