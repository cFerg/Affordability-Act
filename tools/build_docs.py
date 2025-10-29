#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Builds/refreshes:
  - policy/README.md      (injects section index between markers)
  - policy/outline.md     (injects section summaries between markers)
  - policy/bill-text.md   (compiles full bill between markers)

Works with either section layout:
  A) policy/sections/01_Foo/README.md
  B) policy/sections/01_Foo.md

Markers expected:
  policy/README.md:
    <!-- BEGIN:SECTION_INDEX -->
    ... (generated) ...
    <!-- END:SECTION_INDEX -->

  policy/outline.md:
    <!-- BEGIN:SECTION_OUTLINE -->
    ... (generated) ...
    <!-- END:SECTION_OUTLINE -->

  policy/bill-text.md:
    <!-- BEGIN:BILL_BODY -->
    ... (generated) ...
    <!-- END:BILL_BODY -->
"""

import os
import re
import io
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POLICY_DIR = os.path.join(ROOT, "policy")
SECTIONS_DIR = os.path.join(POLICY_DIR, "sections")
README_PATH = os.path.join(POLICY_DIR, "README.md")
OUTLINE_PATH = os.path.join(POLICY_DIR, "outline.md")
BILL_PATH = os.path.join(POLICY_DIR, "bill-text.md")

IDX_BEGIN = r"<!--\s*BEGIN:SECTION_INDEX\s*-->"
IDX_END   = r"<!--\s*END:SECTION_INDEX\s*-->"
OUT_BEGIN = r"<!--\s*BEGIN:SECTION_OUTLINE\s*-->"
OUT_END   = r"<!--\s*END:SECTION_OUTLINE\s*-->"
BILL_BEGIN = r"<!--\s*BEGIN:BILL_BODY\s*-->"
BILL_END   = r"<!--\s*END:BILL_BODY\s*-->"

FM_RE = re.compile(r"^---\s*\r?\n(.*?)\r?\n---\s*\r?\n", re.S)     # YAML front matter
H1_RE = re.compile(r"^\s*#\s+(.+?)\s*$", re.M)            # first H1
SUMMARY_RE = re.compile(r"<!--\s*SUMMARY:\s*(.*?)\s*-->", re.S)

def read_text(path: str) -> str:
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_text(path: str, text: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)

def file_exists(path: str) -> bool:
    try:
        return os.path.isfile(path)
    except Exception:
        return False

def list_sections():
    """
    Return a list of dicts with:
      name: '01_Foundations_of_Ownership'
      md_path: absolute path to MD file
      url: '/policy/sections/01_Foundations_of_Ownership/'
      flat: bool (True if flat file)
    """
    items = []
    if not os.path.isdir(SECTIONS_DIR):
        return items

    for entry in sorted(os.listdir(SECTIONS_DIR)):
        full = os.path.join(SECTIONS_DIR, entry)
        if os.path.isdir(full):
            md = os.path.join(full, "README.md")
            if file_exists(md):
                items.append({
                    "name": entry,
                    "md_path": md,
                    "url": f"/policy/sections/{entry}/",
                    "flat": False,
                })
        elif entry.lower().endswith(".md"):
            name = entry[:-3]
            items.append({
                "name": name,
                "md_path": full,
                "url": f"/policy/sections/{name}/",
                "flat": True,
            })

    def sort_key(d):
        m = re.match(r"^(\d+)", d["name"])
        return int(m.group(1)) if m else 9999
    items.sort(key=sort_key)
    return items

def ensure_front_matter(md_path: str, title: str, permalink: str):
    """
    Ensure MD has front-matter with layout/title/permalink.
    Also ensure ONE blank line after closing --- so it doesn't bleed into content.
    """
    text = read_text(md_path)
    fm = {}
    body = text
    m = FM_RE.match(text)
    if m:
        # parse existing fm
        raw = m.group(1)
        body = text[m.end():]
        for line in raw.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                fm[k.strip()] = v.strip().strip("'\"")
    changed = False
    if fm.get("layout") != "default":
        fm["layout"] = "default"; changed = True
    if fm.get("title") != title:
        fm["title"] = title; changed = True
    if fm.get("permalink") != permalink:
        fm["permalink"] = permalink; changed = True

    if changed or not m:
        lines = ["---"]
        for k in ("layout", "title", "permalink"):
            lines.append(f"{k}: {fm[k]}")
        lines.append("---")
        # critical: TWO newlines after fm block
        new_text = "\n".join(lines) + "\n\n" + body.lstrip("\n")
        write_text(md_path, new_text)

def strip_front_matter(text: str) -> str:
    # Remove a front-matter block if present at the very beginning
    m = FM_RE.match(text)
    if m:
        return text[m.end():]
    # Fallback: strip any leading '--- ... ---' block even if formatting was odd
    if text.lstrip().startswith('---'):
        parts = text.split('---')
        if len(parts) >= 3:
            # drop first two '---' segments: ['', '\nfm\n', '\nbody...']
            return '---'.join(parts[2:]).lstrip('\r\n')
    return text

def extract_title_from_filename(name: str) -> str:
    # '01_Foundations_of_Ownership' -> '01 — Foundations of Ownership'
    m = re.match(r"^(\d+)[ _-]+(.+)$", name)
    if m:
        num = m.group(1)
        label = m.group(2).replace("_", " ").replace("-", " ")
        return f"{num} — {label}"
    return name.replace("_", " ").replace("-", " ")

def extract_title_from_md(md_text: str, fallback: str) -> str:
    m = FM_RE.match(md_text)
    if m:
        raw = m.group(1)
        for line in raw.splitlines():
            if line.strip().startswith("title:"):
                return line.split(":", 1)[1].strip().strip("'\"")
    m = H1_RE.search(md_text)
    if m:
        return m.group(1).strip()
    return fallback

def extract_summary(md_text: str) -> str:
    m = SUMMARY_RE.search(md_text)
    return m.group(1).strip() if m else "(Summary not provided)"

def patch_between_markers(path: str, begin_pat: str, end_pat: str, new_block: str):
    if not file_exists(path):
        write_text(path, f"{begin_pat}\n{new_block.strip()}\n{end_pat}\n")
        return
    text = read_text(path)
    begin = re.search(begin_pat, text)
    end = re.search(end_pat, text)
    if not begin or not end:
        # append if markers missing
        block = f"\n{begin_pat}\n{new_block.strip()}\n{end_pat}\n"
        write_text(path, text.rstrip() + block)
        return
    start = begin.end()
    stop = end.start()
    updated = text[:start] + "\n" + new_block.strip() + "\n" + text[stop:]
    if updated != text:
        write_text(path, updated)

def ensure_anchors(md_body: str, section_index: int) -> str:
    sid = f"section-{section_index}"
    # Always inject a hard HTML anchor first, so #section-n works no matter what
    injected = f'<a id="{sid}"></a>\n'

    # If there is a first-level heading, append an explicit id if missing
    m = H1_RE.search(md_body)
    if m:
        h1_line = m.group(0)
        if "{#section-" not in h1_line and f'id="{sid}"' not in h1_line:
            # Prefer Markdown-style ID so TOC works in GH/Jekyll
            new_h1 = h1_line + f" {{#{sid}}}"
            md_body = md_body.replace(h1_line, new_h1, 1)
        return injected + md_body.lstrip()

    # If no H1, synthesize one so the page remains navigable
    return injected + f"# Section {section_index} {{#{sid}}}\n\n" + md_body.lstrip()


def main():
    sections = list_sections()
    if not sections:
        print("No sections found under policy/sections/")
        return

    # Build index + outline + bill content
    index_lines = []
    outline_lines = []
    bill_lines = []

    for idx, s in enumerate(sections, start=1):
        name = s["name"]
        md_path = s["md_path"]
        url = s["url"]

        title_guess = extract_title_from_filename(name)
        # ensure front matter exists & is clean
        ensure_front_matter(md_path, title_guess, url)

        raw = read_text(md_path)
        title = extract_title_from_md(raw, title_guess)
        summary = extract_summary(raw)

        # index & outline
        index_lines.append(f"- **[{title}]({url})** — {summary}")
        outline_lines.append(f"### [{title}]({url})\n\n{summary}\n")

        # section content for bill
        body = strip_front_matter(raw)
        # remove SUMMARY comment blocks before compiling
        body = re.sub(r'<!--\s*SUMMARY:.*?-->\s*', '', body, flags=re.S)
        body = ensure_anchors(body, idx)
        # final guard: strip any accidental front-matter-like lines from the top of body
        body = re.sub(r"^---[\s\S]*?---\s*\r?\n", "", body, flags=re.M)
        # separate sections with a horizontal rule for readability
        if idx > 1:
            bill_lines.append("\n---\n")
        bill_lines.append(body.rstrip() + "\n")

    # Write policy/README.md (index)
    patch_between_markers(README_PATH, IDX_BEGIN, IDX_END, "\n".join(index_lines))

    # Write policy/outline.md (summaries)
    patch_between_markers(OUTLINE_PATH, OUT_BEGIN, OUT_END, "\n\n".join(outline_lines))

    # Write compiled bill into policy/bill-text.md between markers
    bill_block = "\n".join(bill_lines).strip() + "\n"
    patch_between_markers(BILL_PATH, BILL_BEGIN, BILL_END, bill_block)

    search_items = []
    for idx, s in enumerate(sections, start=1):
        name = s["name"]; url = s["url"]
        raw = read_text(s["md_path"])
        title = extract_title_from_md(raw, extract_title_from_filename(name))
        summary = extract_summary(raw)
        search_items.append({"title": title, "url": url, "summary": summary})
    write_text(os.path.join(ROOT, "search.json"), json.dumps(search_items, ensure_ascii=False, indent=2))


    print(f"Updated: index ({len(sections)}), outline, and compiled bill.")

if __name__ == "__main__":
    main()
