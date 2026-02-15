#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SECTIONS_DIR = ROOT / "policy" / "sections"
DATA_DIR = ROOT / "_data"
DATA_DIR.mkdir(exist_ok=True)

OUT_SECTIONS = DATA_DIR / "sections.json"
OUT_BILL = ROOT / "policy" / "bill-text.md"
OUT_SEARCH = ROOT / "search.json"

SECTION_RE = re.compile(r"^##\s*(Section\s+\d+.*)$", re.MULTILINE)
CATEGORY_RE = re.compile(r"^#\s+(.+)$", re.MULTILINE)

FRONTMATTER_RE = re.compile(r"^---\s.*?\s---\s*", re.S)
FENCED_CODE_RE = re.compile(r"```.*?```", re.S)
MD_LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")
INLINE_CODE_RE = re.compile(r"`([^`]+)`")
HEADING_MARK_RE = re.compile(r"^#{1,6}\s*", re.M)
WHITESPACE_RE = re.compile(r"\s+")

def slug_to_order(slug: str) -> int:
    try:
        return int(slug.split("_", 1)[0])
    except Exception:
        return 9999

def strip_frontmatter(md: str) -> str:
    return FRONTMATTER_RE.sub("", md)

def md_to_text(md: str) -> str:
    """
    Convert markdown-ish content to plain text suitable for search indexing.
    Keep it conservative: remove frontmatter + code blocks + link URLs, collapse whitespace.
    """
    md = strip_frontmatter(md)
    md = FENCED_CODE_RE.sub(" ", md)
    md = MD_LINK_RE.sub(r"\1", md)          # [text](url) -> text
    md = INLINE_CODE_RE.sub(r"\1", md)      # `code` -> code
    md = HEADING_MARK_RE.sub("", md)        # remove heading markers
    md = md.replace("**", "").replace("__", "").replace("*", "").replace("_", "")
    md = re.sub(r"<!--.*?-->", " ", md, flags=re.S)  # remove HTML comments (Summary blocks etc)
    md = WHITESPACE_RE.sub(" ", md).strip()
    return md

items = []
bill_parts = []

for md in sorted(SECTIONS_DIR.glob("*.md")):
    text = md.read_text(encoding="utf-8")

    slug = md.stem
    order = slug_to_order(slug)

    category_match = CATEGORY_RE.search(text)
    category = category_match.group(1).strip() if category_match else "Sections"

    section_match = SECTION_RE.search(text)
    section_title = section_match.group(1).strip() if section_match else slug.replace("_", " ")

    url = f"/policy/sections/{slug}/"

    items.append({
        "slug": slug,
        "order": order,
        "category": category,
        "sectionTitle": section_title,
        "url": url
    })

    # Bill text: remove frontmatter only, keep markdown structure for the compiled page
    cleaned = strip_frontmatter(text)
    bill_parts.append(cleaned.strip())

# Sort once, everywhere
items.sort(key=lambda x: x["order"])

# Write sections.json (RICH OBJECTS)
OUT_SECTIONS.write_text(
    json.dumps(items, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8"
)

# Write compiled bill
compiled_bill_md = "# Full Compiled Bill\n\n" + "\n\n---\n\n".join(bill_parts) + "\n"
OUT_BILL.write_text(compiled_bill_md, encoding="utf-8")

# Write search index (now includes content)
search_docs = [
    {
        "id": "bill",
        "title": "Full compiled bill",
        "url": "/policy/bill-text/",
        "order": 0,
        "category": "Full Bill",
        "content": md_to_text(compiled_bill_md),
    }
]

for it in items:
    section_path = SECTIONS_DIR / f"{it['slug']}.md"
    raw_md = section_path.read_text(encoding="utf-8") if section_path.exists() else ""
    search_docs.append({
        "id": it["slug"],
        "title": it["sectionTitle"],
        "url": it["url"],
        "category": it["category"],
        "order": it["order"],
        "content": md_to_text(raw_md),
    })

OUT_SEARCH.write_text(
    json.dumps({"documents": search_docs}, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8"
)

print(f"Generated {len(items)} sections")
print(f"Wrote: {OUT_SECTIONS.relative_to(ROOT)}")
print(f"Wrote: {OUT_BILL.relative_to(ROOT)}")
print(f"Wrote: {OUT_SEARCH.relative_to(ROOT)}")