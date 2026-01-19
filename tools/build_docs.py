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

def slug_to_order(slug: str) -> int:
    try:
        return int(slug.split("_", 1)[0])
    except Exception:
        return 9999

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

    # Bill text
    cleaned = re.sub(r"^---.*?---\s*", "", text, flags=re.S)
    bill_parts.append(cleaned.strip())

# Sort once, everywhere
items.sort(key=lambda x: x["order"])

# Write sections.json (RICH OBJECTS)
OUT_SECTIONS.write_text(
    json.dumps(items, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8"
)

# Write compiled bill
OUT_BILL.write_text(
    "# Full Compiled Bill\n\n" + "\n\n---\n\n".join(bill_parts) + "\n",
    encoding="utf-8"
)

# Write search index
search_docs = [
    {
        "id": "bill",
        "title": "Full compiled bill",
        "url": "/policy/bill-text/"
    }
]

for it in items:
    search_docs.append({
        "id": it["slug"],
        "title": it["sectionTitle"],
        "url": it["url"],
        "category": it["category"]
    })

OUT_SEARCH.write_text(
    json.dumps({"documents": search_docs}, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8"
)

print(f"Generated {len(items)} sections")